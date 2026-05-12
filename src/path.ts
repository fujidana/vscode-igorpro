/***
 * Module for handling file paths, especially for files included in Igor Pro procedure files.
 * Igor Pro uses a HFS path format for including files in procedure files,
 * which is different from the standard POSIX path format. and operating systems.
 * This module also provides functions to convert between these two path formats.
 */

import * as vscode from 'vscode';
import * as lang from './language';
import { existsSync, promises } from 'node:fs';
import { relative } from 'node:path';

/**
 * Convert a POSIX path to a classic Mac OS path (also known as HFS path).
 * @param posixPath POSIX path.
 * @returns HFS path, or `undefined` if the conversion is not possible (e.g., when the platform is not Windows or macOS).
 */
function hfsPathFromPosixPath(posixPath: string): string | undefined {
    const segments: string[] = [];
    posixPath.split('/').forEach(segment => {
        if (segment === '.') {
            // do nothing
        } else if (segment === '..') {
            segments.push('');
        } else {
            segments.push(segment.replace(/:/g, ''));
        }
    });

    if (posixPath.startsWith('/')) {
        if (process.platform === 'win32') {
            segments.shift();
        } else if (process.platform === 'darwin') {
            // Since a partition name is not included in a POSIX path, here
            // the default value is used instead.
            segments[0] = 'Macintosh HD';
        } else {
            return undefined;
        }
    } else {
        segments.unshift('');
    }
    return segments.join(':');
}

/**
 * Convert a classic Mac OS path (also known as HFS path) to a POSIX path.
 * e.g.,
 * - absolute path:
 *   - 'Hard Drive:absolute:path:to:file.txt' -> '/absolute/path/to/file.txt' (macOS)
 *   - 'C:absolute:path:to:file.txt' -> '/C:/absolute/path/to/file.txt' (Windows)
 * - relative path:
 *   - ':relative:path:to:file.txt' -> './relative/path/to/file.txt'
 *   - ':::path1::path2:path3:' -> './../../path1/../path2/path3/'
 * @param hfsPath HFS path.
 * @returns POSIX path, or `undefined` if the conversion is not possible (e.g., when the platform is not Windows or macOS).
 */
function posixPathFromHfsPath(hfsPath: string) {
    // Replace path separators, taking parent directory pattern (`::`) into
    // consideration.
    const segments = hfsPath.split(':').map((segment, index, array) => {
        if (segment.length === 0) {
            if (index === 0) {
                return '.';
            } else if (index === array.length - 1) {
                return '';
            } else {
                return '..';
            }
        } else {
            return segment;
        }
    });

    // In case the path is an absolute path, a partition name at the head of an
    // HFS path is treated differently on Windows and macOS. On Windows 
    // it is used like `/C:/parent/child`. On macOS it is not used in a POSIX
    // path.
    if (!hfsPath.startsWith(':')) {
        if (process.platform === 'win32') {
            if (segments.length > 0) {
                segments[0] = segments[0] + ':';
            }
        } else if (process.platform === 'darwin') {
            if (segments.length > 0) {
                segments[0] = '';
            }
        } else {
            return undefined;
        }
    }
    return segments.join('/');
}

/**
 * Return the path to a special directory.
 * 
 * The root of "app" domain is "Igor Pro N Folder" folder in the Applications folder.
 * This folder contains "User Procedures", "WaveMetrics Procedures", "Igor Procedures", etc.
 * 
 * The root of "user" domain is "Igor Pro N User Files" folder.
 * This folder contains "User Procedures", "Igor Procedures", etc.
 * @param domain 'app' or 'user'.
 * @param majorVersion Major version of Igor Pro. N in "Igor Pro N folder".
 * @param dirName Optional name of the subdirectory under the root directory. If not provided, the path to the root directory is returned.
 * @returns Path to the specified directory, or `undefined` if the path cannot be determined (e.g., when the platform is not Windows or macOS).
 */
function igorSpecialDir(domain: 'user' | 'app', majorVersion: number, dirName?: 'User Procedures' | 'WaveMetrics Procedures') {
    let basePath: string | undefined;

    if (domain === 'app') {
        if (process.platform === 'win32') {
            basePath = `/C:/Program Files/WaveMetrics/Igor Pro ${majorVersion} Folder`;
        } else if (process.platform === 'darwin') {
            basePath = `/Applications/Igor Pro ${majorVersion} Folder`;
        }
    } else if (domain === 'user') {
        const homedir = process.env.HOME || process.env.USERPROFILE; // || os.homedir();
        if (homedir) {
            basePath = `${homedir}/Documents/WaveMetrics/Igor Pro ${majorVersion} User Files`;
        }
    }

    if (!dirName) {
        return basePath;
    } else {
        return basePath ? basePath + '/' + dirName : undefined;
    }
}

// function parseIncludeStatements(content: string, baseUri: vscode.Uri): lang.IncludeArgument[] {
//     const lines = content.split(/\n|\r\n?/);

//     const includeRegExp: RegExp = /^(#include\b\s*)(<([^"<>]+)>|"([^"<>]+)")/;
//     const includeArguments: lang.IncludeArgument[] = [];

//     for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
//         const lineText = lines[lineIndex];
//         const matches = lineText.match(includeRegExp);
//         if (matches !== null) {
//             const range = new vscode.Range(lineIndex, matches[1].length + 1, lineIndex, matches[1].length + matches[2].length - 1);
//             includeArguments.push({ range, raw: matches[3], builtin: matches[2].startsWith('<') });
//         }
//     }
//     return includeArguments;
// }

/**
 * Find a file specified in `#include` statement.
 * In several cases, Igor Pro looks for a file of specified name from 
 * different folders and use the first one found in one of the folders.
 * To follow this behavior, the method needs to check the file existence
 * and thus the URI of a found file is returned asynchronously.
 * @param incArg Include argument object.
 * @param majorVersion Major version of Igor Pro. N in "Igor Pro N folder".
 * @param baseUri Base URI. This URI is used only when the include argument is a relative path.
 * @return URI of the file specified in the include argument, or `undefined` if the file cannot be found.
 */
export async function uriFromIgorInclude(incArg: lang.IncludeArgument, majorVersion: number, baseUri: vscode.Uri): Promise<vscode.Uri | undefined> {
    if (incArg.builtin) {
        // In case the statement is like `#include <ipffile>`, the file
        // should be placed in "WaveMetrics Procedures" folder or its
        // subfolder.
        const basePath = igorSpecialDir('app', majorVersion, 'WaveMetrics Procedures');
        if (basePath !== undefined) {
            for await (const path of promises.glob(`**/${incArg.raw}.ipf`, { cwd: basePath })) {
                return vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
            }
        }
    } else if (!incArg.raw.includes(':')) {
        // In case the statement is like `#include "ipffile"` (no path
        // separator), the file should be placed in "User Procedures" 
        // or its subfolder.
        // There are two "User Procedures" folders. One is in
        // "Igor Pro Folder" and the other is in "Igor Pro User Files".
        const domains = ['app', 'user'] as const;
        for (const domain of domains) {
            const basePath = igorSpecialDir(domain, majorVersion, 'User Procedures');
            if (basePath !== undefined) {
                for await (const path of promises.glob(`**/${incArg.raw}.ipf`, { cwd: basePath })) {
                    return vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
                }
            }
        }
    } else if (!incArg.raw.startsWith(':')) {
        // In case the statement uses an aboslute path, like
        // #include "Hard Drive:absolute:path:to:ipffile".
        const path = posixPathFromHfsPath(incArg.raw + '.ipf');
        const uri2 = path ? vscode.Uri.file(path) : undefined;
        return uri2 && existsSync(uri2.path) ? uri2 : undefined;
        // return (uri2 && (await vscode.workspace.fs.stat(uri2)).type & vscode.FileType.File) ? uri2 : undefined;
    } else {
        // In case the statement uses a relative path, like
        // `#include ":relative:path:to:ipffile"`, the relative is revolved
        // to either the Igor Pro Folder, the Igor Pro User Files folder,
        // or the folder containing the procedure file that contains the
        // `#include` statement.
        const basePaths = [
            igorSpecialDir('app', majorVersion),
            igorSpecialDir('user', majorVersion),
            baseUri.path
        ];
        const path = posixPathFromHfsPath(incArg.raw + '.ipf');
        if (path) {
            for (const basePath of basePaths) {
                if (basePath) {
                    const uri2 = vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
                    if (existsSync(uri2.path)) {
                        // if ((await vscode.workspace.fs.stat(uri2)).type & vscode.FileType.File) {
                        return uri2;
                    }
                }
            }
        }
    }
    return undefined;
}

/**
 * Generates `#include ...` code for a given IPF file URI.
 * @param ipfFileUri URI of an IPF file. The URI must have a path that ends with `.ipf`.
 * @param majorVersion Major version of Igor Pro. N in "Igor Pro N folder".
 * @param documentUri URI of the document where the generated code will be inserted. This is used to calculate a relative path when the IPF file is not in a special folder.
 * @returns `#include` code for the given IPF file URI, or `undefined` if the URI is invalid or the generated code cannot be determined.
 */
export function includeCodeForIpfFileUri(ipfFileUri: vscode.Uri, majorVersion: number, documentUri: vscode.Uri): string | undefined {
    const ipfPath = ipfFileUri.path;
    if (!ipfPath.toLowerCase().endsWith('.ipf')) {
        return undefined;
    }

    const pathSegments = ipfPath.split('/');
    const lastPathSegment = pathSegments[pathSegments.length - 1];
    const baseName = lastPathSegment.substring(0, lastPathSegment.length - 4);
    let specialDir: string | undefined;
    if ((specialDir = igorSpecialDir('app', majorVersion, 'WaveMetrics Procedures')) !== undefined && ipfPath.startsWith(specialDir + '/')) {
        return `#include <${baseName}>\n`;
    } else if ((specialDir = igorSpecialDir('app', majorVersion, 'User Procedures')) !== undefined && ipfPath.startsWith(specialDir + '/')) {
        return `#include "${baseName}"\n`;
    } else if ((specialDir = igorSpecialDir('user', majorVersion, 'User Procedures')) !== undefined && ipfPath.startsWith(specialDir + '/')) {
        return `#include "${baseName}"\n`;
    } else {
        // Show in relative path.
        // While a Relative path can have three bases
        // the Igor Pro Folder, the Igor Pro User Files folder,
        // and the folder containing the procedure file, 
        // here the base is the last one.
        const pathFrom = vscode.Uri.joinPath(documentUri, '..').path;
        const pathTo = ipfPath.substring(0, ipfPath.length - 4);
        const relPath = relative(pathFrom, pathTo);
        return `#include "${hfsPathFromPosixPath(relPath)}"\n`;
    }
}