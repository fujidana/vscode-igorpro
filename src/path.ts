/**
 * Module for handling file paths, especially for files included in Igor Pro procedure files.
 * Igor Pro uses a HFS path format for including files in procedure files,
 * which is different from the standard POSIX path format.
 * This module also provides functions to convert between these two path formats.
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import { relative } from 'node:path';

/**
 * Convert a POSIX path to a classic Mac OS path (also known as HFS path).
 * 
 * An absolute path in HFS format starts with a drive letter (Windows) or a 
 * partition name (macOS), which is not included in a POSIX path.
 * The function uses "C" on Windows and "Macintosh HD" on macOS as the partition name,
 * assuming that `posixPath` is pointing to a file in the boot partition
 * whose label is not customized by the user.
 * 
 * Conversion fails and `undefined` is returned when `posixPath` is an absolute path
 * and the extension is not run in the descktop version of VS Code on either Windows or macOS
 *  (i.e., Linux on VS Code desktop or any platforms in a web browser).
 * @param posixPath POSIX path.
 * @returns HFS path, or `undefined` if the conversion fails.
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
 * 
 * - absolute path:
 *   - 'Hard Drive:absolute:path:to:file.txt' -> '/absolute/path/to/file.txt' (macOS)
 *   - 'C:absolute:path:to:file.txt' -> '/C:/absolute/path/to/file.txt' (Windows)
 * - relative path:
 *   - 'file.txt' -> 'file.txt'
 *   - ':relative:path:to:file.txt' -> './relative/path/to/file.txt'
 *   - ':::path1::path2:path3:' -> './../../path1/../path2/path3/'
 * 
 * Currently the function assumes that the first path component of an HFS absolute
 * path is the name of the boot partition. On Windows, the value is reused
 * in the POSIX path and on macOS it is removed.
 * 
 * Conversion fails when the path is an absolute path
 * and the extension is not run in VS Code desktop on Windows or macOS
 * (i.e., Linux on desktop or any platforms in a web browser).
 * @param hfsPath HFS path.
 * @returns POSIX path, or `undefined` if the conversion fails.
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
    // path (if it is a boot partition).
    if (segments.length > 0 && !hfsPath.startsWith(':')) {
        if (process.platform === 'win32') {
            segments[0] = segments[0] + ':';
        } else if (process.platform === 'darwin') {
            segments[0] = '';
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
 * 
 * Return `undefined` when the extension is not run in VS Code desktop on Windows or macOS
 * (i.e., Linux on desktop or any platforms in a web browser).
 * @param domain 'app' or 'user'.
 * @param majorVersion Major version of Igor Pro. N in "Igor Pro N folder".
 * @param dirName Optional name of the subdirectory under the root directory. If not provided, the path to the root directory is returned.
 * @returns Path to the specified directory, or `undefined` if the path cannot be determined.
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

/**
 * Find a file specified in `#include` statement.
 * In several cases, Igor Pro looks for a file of specified name from 
 * different folders and use the first one found in one of the folders.
 * To follow this behavior, the method needs to check the file existence
 * and thus the URI of a found file is returned asynchronously.
 * @param filename filename specified in the `#include` statement.
 * @param system specifies whether the file is in the system folder (i.e., "WaveMetrics Procedures" folder) or not. This is determined by whether the filename is enclosed in angle brackets (`<>`) or double quotes (`""`) in the `#include` statement.
 * @param majorVersion Major version of Igor Pro. N in "Igor Pro N folder".
 * @param baseUri Base URI. This URI is used only when the include argument is a relative path.
 * @return URI of the file specified in the include argument, or `undefined` if the file cannot be found.
 */
export async function uriFromIgorInclude(filename: string, system: boolean, majorVersion: number, baseUri: vscode.Uri): Promise<vscode.Uri | undefined> {
    if (system) {
        // In case the statement is like `#include <ipffile>`, 
        // search the "WaveMetrics Procedures" folder and its subfolders for `ipffile.ipf`.
        const basePath = igorSpecialDir('app', majorVersion, 'WaveMetrics Procedures');
        if (basePath !== undefined) {
            for await (const path of fs.promises.glob(`**/${filename}.ipf`, { cwd: basePath })) {
                return vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
            }
        }
    } else if (!filename.includes(':')) {
        // In case the statement is like `#include "ipffile"` (no path separator),
        // search the "User Procedures" folders and their subfolders for `ipffile.ipf`.
        // There are two "User Procedures" folders. One is in
        // "Igor Pro Folder" and the other is in "Igor Pro User Files".
        const domains = ['app', 'user'] as const;
        for (const domain of domains) {
            const basePath = igorSpecialDir(domain, majorVersion, 'User Procedures');
            if (basePath !== undefined) {
                for await (const path of fs.promises.glob(`**/${filename}.ipf`, { cwd: basePath })) {
                    return vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
                }
            }
        }
    } else if (!filename.startsWith(':')) {
        // In case the statement uses an aboslute path, like
        // #include "Hard Drive:absolute:path:to:ipffile".
        const path = posixPathFromHfsPath(filename + '.ipf');
        const uri2 = path ? vscode.Uri.file(path) : undefined;
        const fileType = uri2 ? await getFileTypeAsync(uri2) : undefined;
        return (fileType !== undefined && (fileType & vscode.FileType.File)) ? uri2 : undefined;
    } else {
        // In case the statement uses a relative path, like
        // `#include ":relative:path:to:ipffile"`, the relative is revolved
        // to either the Igor Pro Folder, the Igor Pro User Files folder,
        // or the folder containing the procedure file that contains the
        // `#include` statement.
        const basePaths = [
            igorSpecialDir('app', majorVersion),
            igorSpecialDir('user', majorVersion),
            baseUri.path,
        ];
        const path = posixPathFromHfsPath(filename + '.ipf');
        if (path) {
            for (const basePath of basePaths) {
                if (basePath) {
                    const uri2 = vscode.Uri.joinPath(vscode.Uri.file(basePath), path);
                    const fileType = await getFileTypeAsync(uri2);
                    if (fileType !== undefined && (fileType & vscode.FileType.File)) {
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
 * @param documentUri URI of the document where the generated code will be inserted. This is used to calculate a relative path when the IPF file is not in any special folder.
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

/**
 * Asynchronously returns the file type of a given URI or `undefined` if the file does not exist.
 * @param uri URI of the file.
 * @returns A promise that resolves to the file type of the given URI or `undefined` if the file does not exist.
 * @throws Other errors than "File not found" error.
 */
async function getFileTypeAsync(uri: vscode.Uri): Promise<vscode.FileType | undefined> {
    try {
        return (await vscode.workspace.fs.stat(uri)).type;
    } catch (error) {
        if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
            return undefined;
        } else {
            throw error;
        }
    }

}