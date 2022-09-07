{
  // // JavaScript code
  // function leadingCommentsAddedNode(node, comments) {
  //     if (comments && comments.length !== 0) {
  //     node.leadingComments = comments;
  //   }EmptyEolStmt
  //   return node;EmptyEolStmt
  // }

  // function trailingCommentAddedNode(node, comment) {
  //     if (comment) {
  //     node.trailingComment = comment;
  //   }
  //   return node;
  // }

  // TypeScript code
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
}

Program = p:TLStmt* {
  return { type: 'Program', body: p };
}

// whitespaces
// _0_ = $[ \t]*
// _1_ = $[ \t]+
_0_ = [ \t]* { return text(); }
_1_ = [ \t]+ { return text(); }

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
EolWWOComment = (';' _0_)? p:(Comment / Eol / Eof) { return p ? p : undefined; }
EosWWOComment = EolWWOComment / ';' { return undefined; }
EosLA = Eol / Eof / Comment / ';' {}

StringLiteral 'string literal' =
  // '"' @$('\\' . / [^"])* '"'
  '"' str:$('\\' . / [^"])* '"' { return str; }

StringId 'string identifier' =
  name:StringLiteral { return { type: 'Identifier', name: name, kind: 'string', loc: location(), }; }

ShortName 'short name' =
  // $[a-zA-Z0-9_]+
  [a-zA-Z0-9_]+ { return text(); }

ShortId 'normal identifier' =
  name:ShortName { return { type: 'Identifier', name: name, kind: 'strict', loc: location(), }; }

LiberalName 'liberal name' =
  // "'" @$[^'";:]+ "'"
  "'" str:$[^'";:]+ "'" { return str; }

LiberalId 'liberal identifier' =
  name:LiberalName { return { type: 'Identifier', name: name, kind: 'liberal', loc: location(), }; }

// top-level statements

TLStmt 'top-level statement' =
  lComments:(_0_ @Comment)* tlStmt:(
    _0_ @(TLDecl / Directive)
    /
    // empty line with/without leading comments
    _0_ loc:(Eol { const loc = location(); loc.end = loc.start; return loc; }) { return { type: 'EmptyStatement', loc: loc, }; }
    /
    // end of file at nonzero-length empty line with/without leading comments
    _1_ loc:(Eof { return location(); }) { return { type: 'EmptyStatement', loc: loc, }; }
  ) { return leadingCommentsAddedNode(tlStmt, lComments); }
  /
  // end of file at a zero-length empty line with leading comments
  @EmptyStmtWLComments _0_ Eof

// empty statement that ends with EOL. 
EmptyEolStmt 'empty statement that ends with EOL' =
  _0_ loc:(Eol { const loc = location(); loc.end = loc.start; return loc; }) { return { type: 'EmptyStatement', loc: loc }; }
// unclassified_stmt =
//   !end p:$(!EosLA .)+ {
//     return { type: 'UnclassifiedStatement', value: p, loc: location(), };
//   }

// non-empty statement
UnclassifiedEolStmt =
  !End p:$(!EolWWOComment .)+ tComment:EolWWOComment {
    return { type: 'UnclassifiedStatement', value: p, loc: location(), trailingComment: (tComment ? tComment : undefined), };
  }

// empty statement with at one ore more leadingcomments.
// Intended to consume comment lines just before a block or file ends.
EmptyStmtWLComments 'empty statement with comments' =
  lComments:(_0_ @Comment)+ {
    const loc = location(); loc.start = loc.end; return { type: 'EmptyStatement', leadingComments: lComments, loc: loc, };
  }



// unclassified_stmt =
//   !end p:$(!EosLA .)+ {
//     return { type: 'UnclassifiedStatement', value: p, loc: location(), };
//   }


End =
  // @$("End"i ("Macro"i / "Structure"i)?) _0_ &EosLA
  p:$("End"i ("Macro"i / "Structure"i)?) _0_ &EosLA { return [p, location()]; }
  // p:$("End"i [a-zA-Z0-9_]*) _0_ &EosLA { return [p, location()]; }

// EndStmt =
//   p:End {
//     return { type: 'UnclassifiedStatement', value: p, };
//   }

Directive 'directive' =
  // TODOS: parse values
  '#' id:ShortId remain:$(!EolWWOComment .)* tComment:EolWWOComment {
    return { type: 'Directive', id: id, trailingComment: tComment, };
  }

TLDecl 'top-level declaration' =
  ConstDecl / MenuDecl / PictDecl / StructDecl / MacroDecl / FuncDecl

ConstDecl 'constant declaration' =
  // TODOS: parse a value
  or:('Override'i _1_)? s0:('Static'i _1_)? kind:$('Str'i ? 'Constant'i) flag:(_0_ '/C'i)? _1_ id:ShortId _0_ '=' _0_ value:$(!EolWWOComment .)+ tComment:EolWWOComment {
    return { type: 'ConstantDeclaration', id: id, override: !!or, static: !!s0, kind: kind.toLowerCase() === 'constant' ? 'number' : 'string', value: value, trailingComment: tComment, loc: location(), };
  }

MenuDecl 'menu declaration' =
  declNode:(
    'Menu'i _1_ id:StringId _0_ options:(',' _0_ p:ShortName _0_ { return p; } )* iComment:EolWWOComment body:MenuStmt* _0_ end:End {
      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }
      return { type: 'MenuDeclaration', id: id, options: options, body: body, loc: location(), interceptingComment: iComment, };
    }
  ) _0_ tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

PictDecl 'picture declaration' =
  declNode:(
    s0:('Static'i _1_)? 'Picture'i _1_ id:ShortId _0_ iComment:EolWWOComment body:PictStmt* _0_ end:End {
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
  ) _0_ tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }
 
StructDecl 'structure declaration' =
  declNode:(
    s0:('Static'i _1_)? "Structure"i _1_ id:ShortId _0_ iComment:EolWWOComment body:StructStmt* _0_ end:End {
      if (end[0].toLowerCase() !== 'endstructure') { error(`Expected "EndStructure" but "${end[0]}" found.`, end[1]); }
      return { type: 'StructureDeclaration', id: id, static: !!s0, body: body, loc: location(), interceptingComment: iComment, };
    }
  ) _0_ tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

MacroDecl 'macro declaration' =
  declNode:(
    kind:('Window'i / 'Macro'i / 'Proc'i) _1_ id:ShortId _0_ '(' params:$(!EolWWOComment [^)])* ')' _0_ subtype:(':' _0_ @ShortName _0_)? iComment:EolWWOComment body:FuncStmt* _0_ end:End {
      if (end[0].toLowerCase() !== 'end' && end[0].toLowerCase() !== 'endmacro') { error(`Expected "End" or "EndMacro" but "${end[0]}" found.`, end[1]); }
      return { type: 'MacroDeclaration', id: id, kind: kind.toLowerCase(), params: params, body: body, subtype: subtype, loc: location(), interceptingComment: iComment, };
    }
  ) _0_ tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

FuncDecl 'function declaration' =
  // TODOS: parse parameters
  declNode:(
    ts:('ThreadSafe'i _1_)? or:('Override'i _1_)? s0:('Static'i _1_)? 'Function'i ret:($(_0_ ('/' [a-zA-Z0-9]+ _0_)+) / $(_0_ '[' (!EolWWOComment [^\]])* ']' _0_) / _1_) id:ShortId _0_ '(' params:$(!EolWWOComment [^)])* ')' _0_ subtype:(':' _0_ @ShortName _0_)? iComment:EolWWOComment body:FuncStmt* _0_ end:End {
      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }
      return { type: 'FunctionDeclaration', id: id, threadsafe: !!ts, override: !!or, static: !!s0, params: params, return: ret, body: body, subtype: subtype, loc: location(), interceptingComment: iComment, };
    }
  ) _0_ tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

// body of top-level statements

MenuStmt 'statement in menu block' =
  lComments:(_0_ @Comment)* menuStmt:(
    _0_ @(SubmenuDecl / MenuItemStmt) / EmptyEolStmt
  ) { return leadingCommentsAddedNode(menuStmt, lComments); }
  /
  // consumed only when comment lines appears just before the block ends.
  EmptyStmtWLComments

PictStmt 'statement in picture block' =
  lComments:(_0_ @Comment)* pictStmt:(
    // ASCII85 block
    _0_ @(Ascii85Block / p:UnclassifiedEolStmt { expected('ASCII85 block or "EndStructure"'); return p; })
    / EmptyEolStmt
  ) { return leadingCommentsAddedNode(pictStmt, lComments); }
  /
  // consumed only when comment lines appears just before the block ends.
  EmptyStmtWLComments

StructStmt 'statement in structure block' =
  lComments:(_0_ @Comment)* structStmt:(
    _0_ @(StructMemberDecl / p:UnclassifiedEolStmt { expected('structure member declaration or "EndStructure"'); return p; })
    / EmptyEolStmt
  ) { return leadingCommentsAddedNode(structStmt, lComments); }
  /
  // consumed only when comment lines appears just before the block ends.
  EmptyStmtWLComments

FuncStmt 'statement in macro and function' =
  lComments:(_0_ @Comment)* funcStmt:(
    // statemtents in function
    _0_ @UnclassifiedEolStmt
    / EmptyEolStmt
  ) { return leadingCommentsAddedNode(funcStmt, lComments); }
  /
  // consumed only when comment lines appears just before the block ends.
  EmptyStmtWLComments

// statements in Menu declarations

SubmenuDecl 'submenu declaration' =
  declNode:(
    'Submenu'i _1_ id:StringId _0_ iComment:EolWWOComment body:MenuStmt* _0_ end:End {
      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }
      return { type: 'SubmenuDeclaration', id: id, body: body, loc: location(), interceptingComment: iComment, };
    }
  ) _0_ tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

MenuItemStmt 'menu item statement' =
  !End p:$(!EolWWOComment .)+ tComment:EolWWOComment {
    return { type: 'MenuItemStatement', value: p, loc: location(), trailingComment: (tComment ? tComment : undefined), };
  }

// statements in Picture declarations

Ascii85Block 'ASCII85 block' =
  blockNode:(
    'ASCII85Begin'i _0_ iComment:EolWWOComment lines:(_0_ !('ASCII85End'i) @$[^ \r\n]+ _0_ Eol)* _0_ 'ASCII85End' {
      return { type: 'Ascii85Block', data: lines, loc: location(), interceptingComment: iComment, };
    }
  ) _0_ tComment:EolWWOComment {
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
      kind:$('Variable'i / 'String'i / 'Wave'i / 'NVAR'i / 'SVAR'i / 'DFREF'i) flag:(_0_ '/' @[a-zA-Z]+)* {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), flag: flag, };
      }
      /
      kind:$('FUNCREF'i / 'STRUCT'i) flag:(_0_ '/' @[a-zA-Z]+)* _1_ proto:ShortName {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), proto: proto, };
      }
    ) _1_ elem_0:StructMemberDeclr elem_1_n:(_0_ ',' _0_ @StructMemberDeclr)* {
        node0.declarations = [elem_0, ...elem_1_n];
        node0.loc = location();
    }
  ) _0_ tComment:EolWWOComment {
    return trailingCommentAddedNode(stmtNode, tComment);
  }

StructMemberDeclr 'structure member declarator' =
  id:(ShortId / LiberalId) size:(_0_ '[' _0_ @$(!EosLA [^\]])* _0_ ']')? {
    return { type: 'StructureMemberDeclarator', id: id, size: size ? size : undefined, loc: location(), };
  }
