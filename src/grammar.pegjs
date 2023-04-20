{{
  const operationRegExp = new RegExp(
    '^('
    + 'Abort|Add(?:FIFO(?:Data|VectData)|Movie(?:Audio|Frame)|WavesTo(?:BoxPlot|ViolinPlot))|AdoptFiles|APMath|Append(?:BoxPlot|Image|LayoutObject|MatrixContour|Text|To(?:Gizmo|Graph|Layout|Table)|ViolinPlot|XYZContour)?|AutoPositionWindow|'
    + 'BackgroundInfo|Beep|BezierToPolygon|BoundingBall|BoxSmooth|BrowseURL|BuildMenu|Button|'
    + 'cd|Chart|Check(?:Box|Displayed)|ChooseColor|Close(?:Help|Movie|Proc)?|Color(?:Scale|Tab2Wave)|Concatenate|Control(?:Bar|Info|Update)|ConvertGlobalStringTextEncoding|ConvexHull|Convolve|Copy(?:DimLabels|File|Folder|Scales)|Correlate|Create(?:AliasShortcut|Browser)|Cross|Ctrl(?:Background|FIFO|NamedBackground)|Cursor|CurveFit|CustomControl|CWT|'
    + 'Debugger(?:Options)?|Default(?:Font|Gui(?:Controls|Font)|TextEncoding)|DefineGuide|DelayUpdate|Delete(?:Annotations|File|Folder|Points)|Differentiate|dir|Display(?:HelpTopic|Procedure)?|Do(?:Alert|IgorMenu|Update|Window|XOPIdle)|DPSS|Draw(?:Action|Arc|Bezier|Line|Oval|PICT|Poly|Rect|RRect|Text|UserShape)|DSP(?:Detrend|Periodogram)|Duplicate(?:DataFolder)?|DWT|'
    + 'EdgeStats|Edit|ErrorBars|EstimatePeakSizes|Execute(?:ScriptText)?|Experiment(?:Info|Modified)|ExportGizmo|Extract|'
    + 'Fast(?:GaussTransform|Op)|FBin(?:Read|Write)|FFT|FGetPos|FIFO(?:2Wave|Status)|Filter(?:FIR|IIR)|Find(?:APeak|Contour|Duplicates|Levels?|Peak|PointsInPoly|Roots|Sequence|Value)|FMaxFlat|FPClustering|fprintf|FReadLine|FSetPos|FStatus|FTP(?:CreateDirectory|Delete|Download|Upload)|FuncFit(?:MD)?|'
    + 'GBLoadWave|Get(?:Axis|Camera|FileFolderInfo|Gizmo|LastUserMenuInfo|Marquee|Mouse|Selection|Window)|Graph(?:Normal|Wave(?:Draw|Edit))|Grep|GroupBox|'
    + 'Hanning|HCluster|HDF5(?:Close(?:File|Group)|Control|Create(?:File|Group|Link)|DimensionScale|Dump(?:Errors)?|FlushFile|List(?:Attributes|Group)|Load(?:Data|Group|Image)|Open(?:File|Group)|Save(?:Data|Group|Image)|UnlinkObject)|Hide(?:IgorMenus|Info|Procedures|Tools)|HilbertTransform|Histogram|'
    + 'ICA|IFFT|Image(?:AnalyzeParticles|Blend|BoundaryToMask|Composite|EdgeDetection|FileInfo|Filter|Focus|FromXYZ|GenerateROIMask|GLCM|HistModification|Histogram|Interpolate|LineProfile|Load|Morphology|Registration|RemoveBackground|Restore|Rotate|Save|SeedFill|Skeleton3d|Snake|Stats|Threshold|Transform|UnwrapPhase|Window)|IndexSort|InsertPoints|InstantFrequency|Integrate(?:2D|ODE)?|Interp3DPath|Interpolate(?:2|3D)|'
    + 'JCAMPLoadWave|JointHistogram|'
    + 'Kill(?:Background|Control|DataFolder|FIFO|FreeAxis|Path|PICTs|Strings|Variables|Waves|Window)|KMeans|'
    + 'Label|Layout(?:PageAction|SlideShow)?|Legend|LinearFeedbackShiftRegister|ListBox|Load(?:Data|PackagePreferences|PICT|Wave)|Loess|LombPeriodogram|'
    + 'Make(?:Index)?|MarkPerfTestTime|Matrix(?:Balance|Convolve|Corr|EigenV|Factor|Filter|GaussJ|GLM|Inverse|LinearSolve(?:TD)?|LLS|LUBkSub|LUD(?:TD)?|Multiply(?:Add)?|OP|ReverseBalance|Schur|Solve|Sparse|SVBkSub|SVD|Transpose)|MeasureStyledText|MLLoadWave|Modify(?:BoxPlot|Browser|Camera|Contour|Control(?:List)?|FreeAxis|Gizmo|Graph|Image|Layout|Panel|Procedure|Table|ViolinPlot|Waterfall)?|Move(?:DataFolder|File|Folder|String|Subwindow|Variable|Wave|Window)|MultiTaperPSD|MultiThreadingControl|'
    + 'NeuralNetwork(?:Run|Train)|New(?:Camera|DataFolder|FIFO(?:Chan)?|FreeAxis|Gizmo|Image|Layout|Movie|Notebook|Panel|Path|Waterfall)|Note(?:book(?:Action)?)?|'
    + 'Open(?:Help|Notebook)?|Optimize|'
    + 'ParseOperationTemplate|PathInfo|Pause(?:ForUser|Update)|PCA|Play(?:Movie(?:Action)?|Sound)|PolygonOp|Popup(?:ContextualMenu|Menu)|Preferences|PrimeFactors|Print(?:f|Graphs|Layout|Notebook|Settings|Table)?|Project|PulseStats|PutScrapText|pwd|'
    + 'Quit|'
    + 'RatioFromNumber|Redimension|Remez|Remove(?:Contour|From(?:Gizmo|Graph|Layout|Table)|Image|LayoutObjects|Path)?|Rename(?:DataFolder|Path|PICT|Window)?|Reorder(?:Images|Traces)|Replace(?:Text|Wave)|Resample|ResumeUpdate|Reverse|Rotate|'
    + 'Save(?:Data|Experiment|GizmoCopy|GraphCopy|Notebook|PackagePreferences|PICT|TableCopy)?|Set(?:ActiveSubwindow|Axis|Background|DashPattern|DataFolder|DimLabel|Draw(?:Env|Layer)|FileFolderInfo|Formula|IdlePeriod|Igor(?:Hook|MenuMode|Option)|Marquee|ProcessSleep|RandomSeed|Scale|Variable|Wave(?:Lock|TextEncoding)|Window)|Show(?:IgorMenus|Info|Tools)|Silent|Sleep|Slider|Smooth(?:Custom)?|Sort(?:Columns)?|Sound(?:In(?:Record|Set|StartChart|Status|StopChart)|LoadWave|SaveWave)|Spherical(?:Interpolate|Triangulate)|Split(?:String|Wave)|sprintf|sscanf|Stack(?:Windows)?|Stats(?:AngularDistanceTest|ANOVA(?:1|2(?:NR|RM)?)Test|ChiTest|Circular(?:CorrelationTest|Means|Moments|TwoSampleTest)|CochranTest|ContingencyTable|DIPTest|DunnettTest|FriedmanTest|FTest|HodgesAjneTest|JBTest|KDE|KendallTauTest|KSTest|KWTest|Linear(?:CorrelationTest|Regression)|MultiCorrelationTest|NP(?:MCTest|NominalSRTest)|Quantiles|RankCorrelationTest|Resample|Sample|ScheffeTest|ShapiroWilkTest|SignTest|SRTest|TTest|TukeyTest|VariancesTest|Watson(?:USquaredTest|WilliamsTest)|WheelerWatsonTest|WilcoxonRankTest|WRCorrelationTest)|STFT|String|Struct(?:Fill|Get|Put)|Sum(?:Dimension|Series)|'
    + 'TabControl|Tag|Text(?:2Bezier|Box|Histogram)|Thread(?:GroupPutDF|Start)|TickWavesFromAxis|Tile(?:Windows)?|TitleBox|ToCommandLine|ToolsGrid|Triangulate3d|'
    + 'Unwrap|UnzipFile|URLRequest|'
    + 'ValDisplay|Variable|'
    + 'Wave(?:MeanStdv|Stats|Tracking|Transform)|wfprintf|WignerTransform|WindowFunction|'
    + 'XLLoadWave|'
    + 'DoPrompt|Prompt|WaveClear|'
    + 'complex|double|int(?:64)?|uint64|Variable|String|WAVE|NVAR|SVAR|DFREF|'
    + 'STRUCT|FUNCREF|'
    + 'return)$', 'i'
  );
  // MultiThread
}}

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

  function addProblem(message: string, loc: FileRange, severity = DiagnosticSeverity.Error) {
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

EmptyAboveEndStmt 'empty statement above the end' =
  &End { return { type: 'EmptyStatement', loc: location(), }; }

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
  // p:$('End'i ('Macro'i / 'Structure'i)?) _0 &EosLA { return [p, location()]; }
  p:$('End'i ('Macro'i / 'Structure'i / 'if'i / 'switch'i / 'try'i / 'for'i)?/ 'elseif'i _0 '(' (!EosLA .)*  / 'else'i / 'case'i _1 (!EosLA .)*) _0 &EosLA { return [p, location()]; } / 'default'i / 'catch'i / 'while'i _0 '(' (!EosLA .)*
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
    // TODOS: `params` is not strictly parsed.
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
    // TODOS: `params` is not strictly parsed.
    ts:('ThreadSafe'i _1)? or:('Override'i _1)? s0:('Static'i _1)? 'Function'i ret:($(_0 ('/' [a-zA-Z0-9]+ _0)+) / $(_0 '[' (!EolWWOComment [^\]])* ']' _0) / _1) id:StdId _0 '(' params:$(!EolWWOComment [^)])* ')' _0 subtype:(':' _0 @StdName _0)? iComment:EolWWOComment body:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'end') { error(`Expected "End" but "${end[0]}" found.`, end[1]); }
      return { type: 'FunctionDeclaration', id: id, threadsafe: !!ts, override: !!or, static: !!s0, params: params, return: ret, body: body, subtype: subtype, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

// body of top-level statements

MenuStmt 'statement in menu block' =
  lComments:(_0 @Comment)+ menuStmt:(_0 @(SubmenuDecl / MenuItemStmt / EmptyEolStmt / EmptyEofStmt / EmptyAboveEndStmt)) {
    return leadingCommentsAddedNode(menuStmt, lComments);
  }
  / _0 @(SubmenuDecl / MenuItemStmt / EmptyEolStmt) / _1 @EmptyEofStmt

PictStmt 'statement in picture block' =
  lComments:(_0 @Comment)+ pictStmt:(_0 @(Ascii85Block / InvalidPictStmt / EmptyEolStmt / EmptyEofStmt / EmptyAboveEndStmt)) {
    return leadingCommentsAddedNode(pictStmt, lComments);
  }
  / _0 @(Ascii85Block / EmptyEolStmt / InvalidPictStmt / EmptyEolStmt) / _1 @EmptyEofStmt

InvalidPictStmt =
  stmt:UnclassifiedEolStmt {
    addProblem('Invalid as a picture statement.', stmt.loc);
    return stmt;
  }

StructStmt 'statement in structure block' =
  lComments:(_0 @Comment)+ structStmt:(
    _0 @(StructMemberDecl / InvalidStructStmt / EmptyEolStmt / EmptyEofStmt / EmptyAboveEndStmt)
  ) {
    return leadingCommentsAddedNode(structStmt, lComments);
  }
  /
  _0 @(StructMemberDecl / InvalidStructStmt /EmptyEolStmt)
  /
  _1 @EmptyEofStmt

InvalidStructStmt =
  stmt:UnclassifiedEolStmt {
    addProblem('Invalid as a structure statement.', stmt.loc);
    return stmt;
  }

FuncStmt 'statement in macro and function' =
  lComments:(_0 @Comment)+ funcStmt:(
    _0 @(Directive / IfStmt / SwitchStmt / TryStmt / DoWhileStmt / ForStmt / BreakStmt / ContinueStmt / MultCmndStmt / EmptyEolStmt / EmptyEofStmt / EmptyAboveEndStmt / InvalidFuncStmt)
    // _0 @(UnclassifiedEolStmt / EmptyEolStmt / EmptyEofStmt)
  ) {
    return leadingCommentsAddedNode(funcStmt, lComments);
  }
  /
  // _0 @(UnclassifiedEolStmt / EmptyEolStmt)
  _0 @(Directive / IfStmt / SwitchStmt / TryStmt / DoWhileStmt / ForStmt / BreakStmt / ContinueStmt / MultCmndStmt / EmptyEolStmt / InvalidFuncStmt)
  /
  _1 @EmptyEofStmt

InvalidFuncStmt =
  stmt:UnclassifiedEolStmt {
    addProblem('Invalid as a function/macro statement.', stmt.loc);
    return stmt;
  }

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
      kind:$('u'i? ('char'i / 'int'i ('16' / '32' / '64')) / 'float'i / 'double'i) {
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
        return node0;
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(stmtNode, tComment);
  }

StructMemberDeclr 'structure member declarator' =
  id:(StdId / LiberalId) size:(_0 '[' _0 @$(!EosLA [^\]])* _0 ']')? {
    return { type: 'StructureMemberDeclarator', id: id, size: size ? size : undefined, loc: location(), };
  }

// flow control

IfStmt 'if statement' =
  node:(
    ifCase:(
      'if'i _0 '(' _0 test0:Expr _0 ')' _0 iComment0:EolWWOComment consequent0:FuncStmt* {
        return { type: 'IfCase', test: test0, consequent: consequent0, interceptingComment: iComment0, loc: location(), };
      }
    ) elseifCases:(
      _0 'elseif'i _0 '(' _0 testI:Expr _0 ')' _0 iCommentI:EolWWOComment consequentI:FuncStmt* {
        return { type: 'IfCase', test: testI, consequent: consequentI, interceptingComment: iCommentI, loc: location(), };
      }
    )* elseCase:(
      _0 'else'i _0 iCommentN:EolWWOComment consequentN:FuncStmt* {
        return { type: 'IfCase', consequent: consequentN, interceptingComment: iCommentN, loc: location(), };
      }
    )? _0 end:End {
      if (end[0].toLowerCase() !== 'endif') { error(`Expected "endif" but "${end[0]}" found.`, end[1]); }

      const cases = elseCase ? [ifCase].concat(elseifCases, [elseCase]) : [ifCase].concat(elseifCases);
      return { type: 'IfStatement', cases: cases, loc: location(), };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

SwitchStmt 'switch statement' =
  node:(
    kind:$('str'i? 'switch'i) _0 '(' _0 discriminant:Expr _0 ')' _0 iComment:EolWWOComment (_0 (Comment / Directive))*
    cases:(
      _0 'case'i _1 test:(StringLiteral / SignedNumericLiteral / StdId) ':' _0 iCommentI:EolWWOComment consequent:FuncStmt* {
        return { type: 'SwitchCase', test, consequent, interceptingComment: iCommentI, loc: location(), };
      }
      /
      _0 'default'i _0 ':'_0 iCommentI:EolWWOComment consequent:FuncStmt* {
        return { type: 'SwitchCase', test: null, consequent, interceptingComment: iCommentI, loc: location(), };
      }
    )* _0 end:End {
      if (end[0].toLowerCase() !== 'endswitch') { error(`Expected "endswitch" but "${end[0]}" found.`, end[1]); }

      const kind2 = kind.toLowerCase() === 'strswitch' ? 'string' : 'number';
      return { type: 'SwitchStatement', discriminant: discriminant, kind: kind2, cases, interceptingComment: iComment, loc: location(), };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

TryStmt 'try statement' =
  node:(
    'try'i _0 iComment0:EolWWOComment block:FuncStmt* _0 'catch'i _0 iComment1:EolWWOComment handler:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'endtry') { error(`Expected "endtry" but "${end[0]}" found.`, end[1]); }
      return { type: 'TryStatement', block: block, handler: handler, interceptingComment: iComment1, loc: location(), };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

DoWhileStmt 'do-while statement' =
  node:(
    'do'i _0 iComment:EolWWOComment body:FuncStmt* _0 'while'i _0 '(' test:$(!EolWWOComment [^)])* ')' {
      return { type: 'DoWhileStatement', body: body, test: test, interceptingComment: iComment, loc: location(), };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

ForStmt 'for statement' =
  node:(
    // TODOS: not strict rule
    'for'i _0 '(' _0 CommaSepAssignUpdateExpr? _0 ';' _0 test:Expr _0 ';' _0 CommaSepAssignUpdateExpr? _0 ')' _0 iComment:EolWWOComment body:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'endfor') { error(`Expected "endfor" but "${end[0]}" found.`, end[1]); }
        return { type: 'ForStatement', test: test, body: body, interceptingComment: iComment, loc: location(), }; 
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

CommaSepAssignUpdateExpr 'comma-separated assignment or update expressions' =
  head:(AssignStmt / UpdateExpr) tails:(_0  ',' _0 @(AssignStmt / UpdateExpr))*

BreakStmt 'braek statement' =
  node:(
    'break'i { return { type: 'BreakStatement', loc: location(), }; }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

ContinueStmt 'continue statement' =
  node:(
    'continue'i { return { type: 'ContinueStatement', loc: location(), }; }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

//
MultCmndStmt 'multiple commands statement' =
  !End node:(
    head:CmndStmt tails:(_0 ';' _0 @CmndStmt)* {
      if (tails && tails.length > 0) {
        return { type: 'MultipleStatement', args:[head, ...tails], loc: location(), };
      } else {
        return head;
      }
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

// Expr 'expression' =
// CallExpr / StdId / LiberalId / StringLiteral / NumericLiteral
CmndStmt =
  OpStmt / AssignStmt / UpdateExpr / CallExpr

// 'assignment statement'

AssignStmt 'assignment statement' =
  multiThread:('MultiThread'i (_0 @Flag)* _1)?
  left:LValue _0 op:$('=' !'=' / '+=' / '-=' / '*=' / '/=' / ':=') _0 right:(BraceListExpr / Expr) {
    return { type: 'AssignmentStatement', op, left, right, multiThread: !!multiThread, };
  }

OpStmt 'operation statement' =
  name:$([a-zA-Z][a-zA-Z0-9]*) &{ return operationRegExp.test(name); } flags:(_0 @Flag)* args:(
    (_0 ',' _0 / _1) @(Expr _0 '=' _0 (Expr / BraceListExpr / ParenListExpr / BracketListExpr+) / Expr / BraceListExpr)
  )* flags2:(_0 @Flag)* _0 {
    // TODOS: object properties
    return { type: 'OperationStatement', name, flags, args, flags2};
  }

// list of values surrounded with braces ('{}')
BraceListExpr 'list of values' =
  opener:'{' _0 head:(BraceListExpr / Expr) _0 tails:(',' _0 @(BraceListExpr / Expr) _0)* '}' {
    return { type: 'ListExpression', elements: [head, ...tails], opener, };
  }

// list of values surrounded with parentheses ('()')
ParenListExpr 'list of values' =
  opener:'(' _0 head:(BraceListExpr / Expr) _0 tails:(',' _0 @(BraceListExpr / Expr) _0)* ')' {
    return { type: 'ListExpression', elements: [head, ...tails], opener, };
  }

// list of values surrounded with brackets ('[]')
BracketListExpr '' =
  '[' _0 head:(BraceListExpr / Expr)? _0 tails:(',' _0 @(BraceListExpr / Expr)? _0)* ']' {
    return { type: 'BracketListExpression', elements: [head, ...tails], };
  }

//
RefExpr 'reference expression' =
  '$' _0 arg:Factor {
    return { type: 'ReferenceExpression', arg: arg, };
  }

Expr =
  RefExpr / Order8

// logical AND, OR and conditional (aka ternery) operator
// evaluated from left to right; e.g., `1 ? 2 : 3 ? 4 : 5` returns 4, not 2.
// Unlike C and other several languages, AND and OR have the same priority.
Order8 =
  head:Order7 tails:(_0 ('&&' / '||') _0 Order7 / _0 '?' _0 Order7 _0 ':' _0 Order7)* {
    return tails.reduce((accumulator: any, currentValue: any) => {
      if (currentValue[1] === '&&' || currentValue[1] === '||') {
        return { type: 'BinaryExpression', op: currentValue[1], left: accumulator, right: currentValue[3], };
      } else {
        return { type: 'ConditionalExpression', test: accumulator, consequent: currentValue[3], alternative: currentValue[7], };
      }
    }, head);
  }

// bitwise AND, OR, XOR: '&', '|', '%^'
// evaluated from right to left; e.g, `1 | 3 & 2` returns 3, not 2.
Order7 =
  heads:(Order6 _0 $('&' !'&' / '|' !'|' / '%^') _0)* tail:Order6 {
    return heads.reduceRight((accumulator: any, currentValue: any) => {
      return { type: 'BinaryExpression', op: currentValue[2], left: currentValue[0], right: accumulator, };
    }, tail);
  }

// comparison: '==', '!=', '>', '<', '>=', '<='
// evaluated from right to left; e.g, `2==1>= 0` returns 0, not 1.
Order6 =
  heads:(Order5 _0 $('==' / '!=' / '>' '='? / '<' '='?) _0)* tail:Order5 {
    return heads.reduceRight((accumulator: any, currentValue: any) => {
      return { type: 'BinaryExpression', op: currentValue[2], left: currentValue[0], right: accumulator, };
    }, tail);
  }

// addition or string concatenation, and subtraction: '+', '-'
// evaluated from left to right.
Order5 =
  head:Order4 tails:(_0 $('+' / '-') _0 Order4)* {
    return tails.reduce((accumulator: any, currentValue: any) => {
      return { type: 'BinaryExpression', op: currentValue[1], left: accumulator, right: currentValue[3], };
    }, head);
  }

// multiplication and division: '*', '/'
// evaluated from left to right.
Order4 =
  head:Order3 tails:(_0 $('*' / '/') _0 !(Word+ _0 '=') Order3)* {
    return tails.reduce((accumulator: any, currentValue: any) => {
      return { type: 'BinaryExpression', op: currentValue[1], left: accumulator, right: currentValue[4], };
    }, head);
  }

// negation, logical complement, bitwise complement: '-', '!', '~'.
// evaluated from left to right.
// The extension author adds '+' (without preceding parameter) in this order.
// Igor Pro does not accept continuous '+' and '-' signs while it accepts
// continous '!' and '~'.
// E.g., `print ! ! !! 1` is valid but `print - - -- 1` is invalid.
Order3 =
  heads:($('!' / '~' / '-' ! '-'/ '+' ! '+') _0)* tail:Order2 {
    return heads.reduceRight((accumulator: any, currentValue: any) => {
      return { type: 'UnaryExpression', op: currentValue[0], arg: accumulator, };
    }, tail);
  }

// exponentiation, bitwise left shift, bitwise right shift: '^', '<<', '>>'.
// evaluated from left to right.
Order2 =
  head:Order1 tails:(_0 $('^' / '<<' / '>>') _0 Order1)* {
    return tails.reduce((accumulator: any, currentValue: any) => {
      return { type: 'BinaryExpression', op: currentValue[1], left: accumulator, right: currentValue[3], };
    }, head);
  }

// prefix and postfix increment and decrement: '++', '--'.
// As of Igor Pro 9 on the developer's machine, this operation is only applicable to local variables,
// not to a wave element or global variables.
Order1 =
  UpdateExpr
  /
  Factor


Factor =
  '(' _0 @Expr _0 ')'
  / NumericLiteral / StringLiteral / CallExpr / Variable

UpdateExpr =
  op:('++' / '--') _0 arg:(StdId / LiberalId) {
    return { type: 'UpdateExpression', op: op, arg: arg, prefix: true, };
  }
  /
  arg:(StdId / LiberalId) _0 op:('++' / '--') {
    return { type: 'UpdateExpression', op: op, arg: arg, prefix: false, };
  }

CallExpr 'function call' =
  callee1:(@(StdId / LiberalId) _0) callee2:('#' _0 @(StdId / LiberalId) _0)? '(' _0 args:(expr0:Expr exprs1toN:(_0 ',' _0 @Expr)* { return [expr0, ...exprs1toN]; })? _0')' {
    if (callee2) {
      return { type: 'CallExpression', callee: callee2, module: callee1, arguments: args ?? [], loc: location(), };
    } else {
      return { type: 'CallExpression', callee: callee1, arguments: args ?? [], loc: location(), };
    }
  }

Variable =
  object:(PathExpr / MemberExpr) indexes:(
    _0 '[' _0 index:(@(LabeledIndex / '*') _0)? ']' {
      return { type: 'WaveIndex', scaled: false, index, };
    }
    /
    _0 '(' _0 index:(@(Expr / '*') _0)? ')' {
      return { type: 'WaveIndex', scaled: true, index, };
    }
    /
    _0 '[' _0 start:(@Expr _0)? ',' _0 end:(@Expr _0)? ']' {
      return { type: 'Slice', scaled: false, start, end, };
    }
  )* {
    if (indexes && indexes.length !== 0) {
      return { type: 'ArrayElementExpression', object, indexes, };
    } else {
      return object;
    }
  }

MemberExpr =
  head:ArrayElement tails:(_0 '.' _0 @ArrayElement)* {
    return tails.reduce((accumulator: any, currentValue: any) => {
      return { type: 'MemberExpression', object: accumulator, property: currentValue, };
    }, head);
}

ArrayElement =
  object:(StdId / LiberalId) element:(_0 '[' _0 @Expr _0 ']')? {
    if (element) {
      return { type: 'ArrayElement', object, element, };
    } else {
      return object;
    }
  }


PathExpr 'path expression' =
  heads:(@(RefExpr / StdId / LiberalId)? ':')+ tail:(RefExpr / StdId / LiberalId)? {
    return { type: 'PathExpression', paths: [...heads, tail], loc: location(), };
  }

// // identifiers connected by a dot.
// MemberExpr 'member expression' =

LValue =
  object:(PathExpr / MemberExpr) _0 slices:(
    '[' _0 start:(@LabeledIndex _0)? end:(',' _0 @(LabeledIndex / '*')? _0)? step:(';' _0 @Expr _0)? ']' {
      return { type: 'Slicer', scaled: false, start, end, step, };
    }
    /
    '(' _0 start:(@Expr _0)? end:(',' _0 @(Expr / '*')? _0)? step:(';' _0 Expr _0)? ')' {
      return { type: 'Slicer', scaled: true, start, end, step, };
    }
  )* {
    if (slices && slices.length !== 0) {
      return { type: 'SliceExpression', object, slices, };
    } else {
      return object;
    }
  }

LabeledIndex = 
  label:('%' _0)? arg:Expr {
    if (label) {
      return { type: 'LabeledIndex', arg: arg, };
    } else {
      return arg;
    }
  }

StdName 'standard name' =
  // $[a-zA-Z0-9_]+
  [a-zA-Z][a-zA-Z0-9_]* { return text(); }

StdId 'standard identifier' =
  name:StdName {
    return { type: 'Identifier', name: name, kind: 'strict', loc: location(), };
  }

LiberalName 'liberal name' =
  // "'" @$[^'";:]+ "'"
  "'" str:$[^'";:]+ "'" { return str; }

LiberalId 'liberal identifier' =
  name:LiberalName {
    return { type: 'Identifier', name: name, kind: 'liberal', loc: location(), };
  }

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

SignedNumericLiteral =
  op:('+' /  '-')? _0 arg:NumericLiteral {
    return op ? { type: 'UnaryExpression', op, arg, } : arg;
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
  'U+' body:$([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) {
    return { type: 'Literal', value: String.fromCodePoint(parseInt(body, 16)), raw: text(), loc: location(), };
  }

StringId 'string identifier' =
  name:StringRaw {
    return { type: 'Identifier', name: name, kind: 'string', loc: location(), };
  }

Flag 'operation flag' =
  '/' _0 key:$[a-zA-Z][a-zA-Z0-9]* value:(_0 '=' _0 @(BraceListExpr / ParenListExpr / BracketListExpr+ / SignedNumericLiteral / StringLiteral / CallExpr / RefExpr / Variable))? {
    return { type: 'OperationFlag', key: key, value: value, };
  }
