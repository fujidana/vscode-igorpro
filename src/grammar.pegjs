
{
// TypeScript code
const problems: tree.Problem[] = [];

function leadingCommentsAddedNode(node: tree.BaseStatement, comments: tree.Comment[] | null | undefined) {
    if (comments && comments.length !== 0) {
    node.leadingComments = comments;
  }
  return node;
}

function trailingCommentAddedNode(node: tree.BaseStatement, comment: tree.Comment | null | undefined) {
  if (comment) {
    node.trailingComment = comment;
  }
  return node;
}

function addProblem(message: string, loc: IFileRange, severity = DiagnosticSeverity.Error) {
  problems.push({ message, loc, severity });
}
}

Program = body:TLStmt* {
  return { type: 'Program', body, problems, };
}

// whitespaces
// _0 = $[ \t]*
// _1 = $[ \t]+
_0 = [ \t]* { return text(); }
_1 = [ \t]+ { return text(); }

// Eol: end of line.
// Eof: enf of file.

Eol = ('\n' / '\r\n' / '\r') {}
Eof = !. {}

Comment 'line comment' =
  @(
    '//' p:$(!Eol .)* { return { type: 'Line', value: p, loc: location(), }; }
  ) (Eol / Eof)

// EolWWOComment: end of line with or without a trailing line comment.
// EosWWOComment: end of statement with an optional trailing line comment.
// EosLA: end of statement used in lookahead ('&' and '!').
EolWWOComment = (';' _0)? p:(Comment / Eol / Eof) { return p ? p : undefined; }
EosWWOComment = EolWWOComment / ';' { return undefined; }
EosLA = Eol / Eof / Comment / ';' {}

// commonly used statements

// empty statement that ends with EOL. 
EmptyEolStmt 'empty statement that ends with EOL' =
  Eol { const loc = location(); loc.end = loc.start; return { type: 'EmptyStatement', loc, }; }

EmptyEofStmt 'empty statement that ends with EOF' =
  Eof { return { type: 'EmptyStatement', loc: location(), }; }

// non-empty statement
UnclassifiedEolStmt =
  !End value:$(!EolWWOComment .)+ tComment:EolWWOComment {
    return { type: 'UnclassifiedStatement', value, loc: location(), trailingComment: tComment ?? undefined, };
  }

// top-level statements

TLStmt 'top-level statement' =
  lComments:(_0 @Comment)+ tlStmt:(_0 @(TLDecl / Directive / InvalidTLStmt / EmptyEolStmt / EmptyEofStmt)) {
    return leadingCommentsAddedNode(tlStmt, lComments);
  }
  / _0 @(TLDecl / Directive / InvalidTLStmt / EmptyEolStmt) / _1 @EmptyEofStmt

// non-empty statement
InvalidTLStmt =
  stmt:UnclassifiedEolStmt {
    addProblem('Invalid as a top-level statement.', stmt.loc, DiagnosticSeverity.Warning);
    return stmt;
  }

// empty statement with at one ore more leadingcomments.
// Intended to consume comment lines just before a block or file ends.
EmptyStmtWLComments 'empty statement with comments' =
  lComments:(_0 @Comment)+ {
    const loc = location(); loc.start = loc.end; return { type: 'EmptyStatement', leadingComments: lComments, loc: loc, };
  }

// end of block
End =
  p:$('End'i ('Macro'i / 'Structure'i)?) _0 &EosLA { return [p, location()]; }
  // p:$('End'i ('Macro'i / 'Structure'i / 'if'i / 'switch'i / 'try'i / 'for'i)?/ 'elseif'i _0 '(' (!EosLA .)*  / 'else'i / 'case'i _1 (!EosLA .)*) _0 &EosLA { return [p, location()]; } / 'catch'i / 'while'i _0 '(' (!EosLA .)*
  // p:$("End"i [a-zA-Z0-9_]*) _0 &EosLA { return [p, location()]; }

// EndStmt =
//   p:End {
//     return { type: 'UnclassifiedStatement', value: p, };
//   }

Directive 'directive' =
  // TODOS: parse values
  '#' id:StdId remain:$(!EolWWOComment .)* tComment:EolWWOComment {
    return { type: 'Directive', id: id, trailingComment: tComment, };
  }

TLDecl 'top-level declaration' =
  ConstDecl / MenuDecl / PictDecl / StructDecl / MacroDecl / FuncDecl

ConstDecl 'constant declaration' =
  // TODOS: parse a value
  or:('Override'i _1)? s0:('Static'i _1)? kind:$('Str'i ? 'Constant'i) flag:(_0 '/C'i)? _1 id:StdId _0 '=' _0 value:$(!EolWWOComment .)+ tComment:EolWWOComment {
    return { type: 'ConstantDeclaration', id: id, override: !!or, static: !!s0, kind: kind.toLowerCase() === 'constant' ? 'number' : 'string', value: value, trailingComment: tComment, loc: location(), };
  }

MenuDecl 'menu declaration' =
  declNode:(
    'Menu'i _1 id:StringId _0 options:(',' _0 p:StdName _0 { return p; } )* iComment:EolWWOComment body:MenuStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }
      return { type: 'MenuDeclaration', id, options, body, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

PictDecl 'picture declaration' =
  declNode:(
    s0:('Static'i _1)? 'Picture'i _1 id:StdId _0 iComment:EolWWOComment body:PictStmt* _0 end:End {
      if (body) {
        // // JavaScript code;
        // body = body.filter((stmt) => stmt.type === 'Ascii85Block');
        // TypeScript code:
        body = body.filter((stmt: tree.PictureStatement) => stmt.type === 'Ascii85Block');
      }
      if (!body || body.length === 0) { error('Expected ASCII85 block but not found.'); }
      else if (body.length > 1) { error('Expected only one ASCII85 block but found more.'); }

      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }

      return { type: 'PictureDeclaration', id: id, static: !!s0, body: body, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }
 
StructDecl 'structure declaration' =
  declNode:(
    s0:('Static'i _1)? "Structure"i _1 id:StdId _0 iComment:EolWWOComment body:StructStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'endstructure') { error(`Expected "EndStructure" but "${end[0]}" found.`, end[1]); }
      return { type: 'StructureDeclaration', id: id, static: !!s0, body: body, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

MacroDecl 'macro declaration' =
  declNode:(
    kind:('Window'i / 'Macro'i / 'Proc'i) _1 id:StdId _0 '(' params:$(!EolWWOComment [^)])* ')' _0 subtype:(':' _0 @StdName _0)? iComment:EolWWOComment body:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'end' && end[0].toLowerCase() !== 'endmacro') { error(`Expected "End" or "EndMacro" but "${end[0]}" found.`, end[1]); }
      return { type: 'MacroDeclaration', id: id, kind: kind.toLowerCase(), params: params, body: body, subtype: subtype, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

FuncDecl 'function declaration' =
  // TODOS: parse parameters
  declNode:(
    ts:('ThreadSafe'i _1)? or:('Override'i _1)? s0:('Static'i _1)? 'Function'i ret:($(_0 ('/' [a-zA-Z0-9]+ _0)+) / $(_0 '[' (!EolWWOComment [^\]])* ']' _0) / _1) id:StdId _0 '(' params:$(!EolWWOComment [^)])* ')' _0 subtype:(':' _0 @StdName _0)? iComment:EolWWOComment body:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }
      return { type: 'FunctionDeclaration', id: id, threadsafe: !!ts, override: !!or, static: !!s0, params: params, return: ret, body: body, subtype: subtype, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

// body of top-level statements

MenuStmt 'statement in menu block' =
  lComments:(_0 @Comment)+ menuStmt:(_0 @(SubmenuDecl / MenuItemStmt / EmptyEolStmt / EmptyEofStmt)) {
    return leadingCommentsAddedNode(menuStmt, lComments);
  }
  / _0 @(SubmenuDecl / MenuItemStmt / EmptyEolStmt) / _1 @EmptyEofStmt

PictStmt 'statement in picture block' =
  lComments:(_0 @Comment)+ pictStmt:(_0 @(Ascii85Block / InvalidPictStmt / EmptyEolStmt / EmptyEofStmt)) {
    return leadingCommentsAddedNode(pictStmt, lComments);
  }
  / _0 @(Ascii85Block / EmptyEolStmt / InvalidPictStmt / EmptyEolStmt) / _1 @EmptyEofStmt

InvalidPictStmt =
  stmt:UnclassifiedEolStmt {
    addProblem('Invalid as a picture statement.', stmt.loc);
    return stmt;
  }

StructStmt 'statement in structure block' =
  lComments:(_0 @Comment)+ structStmt:(_0 @(StructMemberDecl / InvalidStructStmt /EmptyEolStmt / EmptyEofStmt)) {
    return leadingCommentsAddedNode(structStmt, lComments);
  }
  / _0 @(StructMemberDecl / InvalidStructStmt /EmptyEolStmt) / _1 @EmptyEofStmt

InvalidStructStmt =
  stmt:UnclassifiedEolStmt {
    addProblem('Invalid as a structure statement.', stmt.loc);
    return stmt;
  }

FuncStmt 'statement in macro and function' =
  lComments:(_0 @Comment)+ funcStmt:(_0 @(UnclassifiedEolStmt / EmptyEolStmt / EmptyEofStmt)) {
    // _0 @(IfStmt / SwitchStmt / TryStmt / DoWhileStmt / ForStmt / CmndStmt / EmptyEolStmt / UnclassifiedEolStmt)
    return leadingCommentsAddedNode(funcStmt, lComments);
  }
  / _0 @(UnclassifiedEolStmt / EmptyEolStmt) / _1 @EmptyEofStmt

// statements in Menu declarations

SubmenuDecl 'submenu declaration' =
  declNode:(
    'Submenu'i _1 id:StringId _0 iComment:EolWWOComment body:MenuStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }
      return { type: 'SubmenuDeclaration', id: id, body: body, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

MenuItemStmt 'menu item statement' =
  !End p:$(!EolWWOComment .)+ tComment:EolWWOComment {
    return { type: 'MenuItemStatement', value: p, loc: location(), trailingComment: (tComment ? tComment : undefined), };
  }

// statements in Picture declarations

Ascii85Block 'ASCII85 block' =
  blockNode:(
    'ASCII85Begin'i _0 iComment:EolWWOComment lines:(_0 !('ASCII85End'i) @$[^ \r\n]+ _0 Eol)* _0 'ASCII85End' {
      return { type: 'Ascii85Block', data: lines, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(blockNode, tComment);
  }

// statements in Structure declarations

// TODOS: Array element is not checked. It may be a literal number, constant, or mathematical operation of them.
StructMemberDecl 'structure member declaration'=
  stmtNode:(
    node0:(
      kind:$('u'i? ('char'i / 'int'i ('16' / '32' / '64')) / 'float' / 'double') {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), };
      }
      / 
      kind:$('Variable'i / 'String'i / 'Wave'i / 'NVAR'i / 'SVAR'i / 'DFREF'i) flag:(_0 '/' @[a-zA-Z]+)* {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), flag: flag, };
      }
      /
      kind:$('FUNCREF'i / 'STRUCT'i) flag:(_0 '/' @[a-zA-Z]+)* _1 proto:StdName {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), proto: proto, };
      }
    ) _1 elem0:StructMemberDeclr elem1ToN:(_0 ',' _0 @StructMemberDeclr)* {
        node0.declarations = [elem0, ...elem1ToN];
        node0.loc = location();
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(stmtNode, tComment);
  }

StructMemberDeclr 'structure member declarator' =
  id:(StdId / LiberalId) size:(_0 '[' _0 @$(!EosLA [^\]])* _0 ']')? {
    return { type: 'StructureMemberDeclarator', id: id, size: size ? size : undefined, loc: location(), };
  }

StdName 'standard name' =
  // $[a-zA-Z0-9_]+
  [a-zA-Z][a-zA-Z0-9_]* { return text(); }

StdId 'standard identifier' =
  name:StdName { return { type: 'Identifier', name: name, kind: 'strict', loc: location(), }; }

LiberalName 'liberal name' =
  // "'" @$[^'";:]+ "'"
  "'" str:$[^'";:]+ "'" { return str; }

LiberalId 'liberal identifier' =
  name:LiberalName { return { type: 'Identifier', name: name, kind: 'liberal', loc: location(), }; }

NumericLiteral 'numeric literal' =
  // floating-point
  (([0-9]+ (Exponent / '.' [0-9]* Exponent?)) / '.' [0-9]+ Exponent?) {
    return { type: 'Literal', value: parseFloat(text()), raw: text(), loc: location(), };
  }
  /
  // hexadecimal integer
  '0x' body:$[0-9a-fA-F]+ {
    return { type: 'Literal', value: parseInt(body, 16), raw: text(), loc: location(), };
  }
  /
  // decimal integer
  [0-9]+ {
    return { type: 'Literal', value: parseInt(text(), 10), raw: text(), loc: location(), };
  }
  /
  // NaN
  'NaN'i !Word {
    return { type: 'Literal', value: NaN, raw: text(), loc: location(), };
  }
  /
  // Infinity
  'Inf'i !Word {
    return { type: 'Literal', value: Infinity, raw: text(), loc: location(), };
  }

// exponential part in floating-point digit, e.g., E+3 in 1.2E+3)
Exponent = [eE] [+-]? [0-9]+

Word = [a-zA-Z0-9_]

StringRaw 'string' =
  // '"' @$('\\' . / [^"])* '"'
  '"' str:$('\\' . / [^"])* '"' { return str; }

StringLiteral 'string literal' =
  str:StringRaw {
    return { type: 'Literal', value: str, raw: text(), loc: location(), };
  }
  /
  'U+' body:$([0-9][0-9][0-9][0-9]) {
    return { type: 'Literal', value: String.fromCodePoint(parseInt(body, 16)), raw: text(), loc: location(), };
  }

StringId 'string identifier' =
  name:StringRaw { return { type: 'Identifier', name: name, kind: 'string', loc: location(), }; }
