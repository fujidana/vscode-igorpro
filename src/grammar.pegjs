{{
// A JavaScript file is type-checked when the following line is
// at the first line of the file.
// @ts-check

/**
 * JSDoc-style type definitions.
 * @typedef { import('./grammar').LocationRange } LocationRange
 * @typedef { import('./grammar').Location } Location
 * @typedef { import('./grammar').GrammarSource } GrammarSource

 * @typedef { import('./igorproTree').BaseStatement } BaseStatement
 * @typedef { import('./igorproTree').Comment } Comment
 */

// The author is not sure whether the following is a proper way to 
// import `DiagnosticSeverity` from `vscode` in JavaScript.

// import { DiagnosticSeverity } from 'vscode';
const DiagnosticSeverity = require('vscode').DiagnosticSeverity;

// /** @enum {number} */
// const DiagnosticSeverity = {
//   Error: 0,
//   Warning: 1,
//   Information: 2,
//   Hint: 3,
// };

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
  + 'AbortOn(?:Value|RTE)|DoPrompt|Prompt|WaveClear|'
  + 'complex|double|int(?:64)?|uint64|Variable|String|WAVE|NVAR|SVAR|DFREF|'
  + 'STRUCT|FUNCREF)$', 'i'
);
// MultiThread|return
}}

{
  const problems = [];

  /**
   * Add leading comments to a node, it they exist.
   * @param {BaseStatement} node - The node to which the comments are added.
   * @param {Comment[] | null | undefined} comments - The comments to be added.
   * @returns {BaseStatement} - The node with the added comments.
   */
  function leadingCommentsAddedNode(node, comments) {
      if (comments && comments.length !== 0) {
      node.leadingComments = comments;
    }
    return node;
  }

  /**
   * Add a trailing comment to a node, it it exists.
   * @param {BaseStatement} node - The node to which the comments are added.
   * @param {Comment | null | undefined} comment - The comments to be added.
   * @returns {BaseStatement} - The node with the added comment.
   */
  function trailingCommentAddedNode(node, comment) {
    if (comment) {
      node.trailingComment = comment;
    }
    return node;
  }

  /**
   * Add a problem to the problems array.
   * @param {string} message - The error message.
   * @param {LocationRange} loc - The location of the error.
   * @param {number} severity - The severity of the error (default: DiagnosticSeverity.Error).
   */
  function addProblem(message, loc, severity = DiagnosticSeverity.Error) {
    problems.push({ message, loc, severity });
  }


  /**
   * Return a new range object.
   * @param {GrammarSource} source - The source of the grammar.
   * @param {Location} baseLoc - The base location to be referenced.
   * @param {number} length - The length of the range (default: 0).
   * @param {number} offset - The offset to be added to the base location (default: 0).
   * @returns {LocationRange} - The modified location range.
   */
  function getRange(source, baseLoc, length = 0, offset = 0) {
    const start = { line: baseLoc.line, column: baseLoc.column + offset, offset: baseLoc.offset + offset };
    const end = { line: start.line, column: start.column + length, offset: start.offset + offset };
    return { source, start, end };
  }

  /**
   * Add a problem if the increment is empty or '*'.
   * @param {any} inc - The node to check.
   * @returns {void}
   */
  function checkWaveElemInc(inc) {
    if (inc && inc.type === 'Literal') {
      if (inc.raw === '') {
        addProblem('Empty value not allowed at increment of wave subrange.', inc.loc);
      } else if (inc.raw === '*') {
        addProblem('"*" not allowed at increment of wave subrange.', inc.loc);
      }
    }
  }
}

Program = body:TLStmt* {
  return { type: 'Program', body, problems, };
}

// whitespaces
// _0 = $[ \t]*
// _1 = $[ \t]+

// whitespace, horizontal tab and line-continuation
_0 = ([ \t] / '\\' Eol)* { return text(); }
_1 = ([ \t] / '\\' Eol)+ { return text(); }

Comma = _0 ',' _0
CommaWithLoc = _0 ',' _0 { return location(); }

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
  lComments:(_0 @Comment)+ tlStmt:(_0 @(TLDecl / EmptyEolStmt / EmptyEofStmt)) {
    return leadingCommentsAddedNode(tlStmt, lComments);
  }
  / _0 @(TLDecl / EmptyEolStmt) / _1 @EmptyEofStmt

// non-empty statement
InvalidTLStmt =
  stmt:UnclassifiedEolStmt {
    addProblem('Invalid as a top-level statement.', stmt.loc, DiagnosticSeverity.Warning);
    return stmt;
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

// top-level declarations and compiler derivatives
TLDecl 'top-level declaration' =
  ConstDecl / MenuDecl / PictDecl / StructDecl / MacroDecl / FuncDecl / Directive / InvalidTLStmt

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
        body = body.filter((stmt) => stmt.type === 'Ascii85Block');
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
    kind:('Window'i / 'Macro'i / 'Proc'i) _1 id:StdId _0 '(' _0 params:VariableList _0 ')' _0 subtype:(':' _0 @StdName _0)? iComment:EolWWOComment body:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'end' && end[0].toLowerCase() !== 'endmacro') { error(`Expected "End" or "EndMacro" but "${end[0]}" found.`, end[1]); }
      return { type: 'MacroDeclaration', id: id, kind: kind.toLowerCase(), params: params, body: body, subtype: subtype, loc: location(), interceptingComment: iComment, };
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(declNode, tComment);
  }

FuncDecl 'function declaration' =
  // TODOS: parse parameters
  declNode:(
    // TODOS: `ret` is not parsed.
    ts:('ThreadSafe'i _1)? or:('Override'i _1)? s0:('Static'i _1)? 'Function'i !Word flag:(_0 @Flag)* _0 multiReturn:(
      _0 '[' _0 @VariableList _0 ']' _0
    )? id:StdId _0 '(' _0 reqParams:VariableList _0 optParams:(
      '[' _0 params:VariableList _0 ']' { return { params, loc: location(), }; }
    )? _0 ')' _0 subtype:(':' _0 @StdName _0)? iComment:EolWWOComment body:FuncStmt* _0 end:End {
      // check 'end' appears or not.
      // Unless I misread the official manual, `End` is the only closing word 
      // of `Funciton` definition.
      // However, Use of `EndMacro` for `Function` can be found in several IPF files
      // WaveMetrics bundled with Igor Pro.
      // I think it is mistaken usage.
      // If `EndMacro` appears, the parser reports a warning-level problem but 
      // do not stop parsing.
      // 
      // To the contrary, it is clearly written that a `Macro` definition 
      // ends with either `End` or `EndMacro`).
      if (end[0].toLowerCase() === 'endmacro') {
        addProblem(`Expected "End" but "${end[0]}" found.`, end[1], DiagnosticSeverity.Warning);
      } else if (end[0].toLowerCase() !== 'end') {
        error(`Expected "End" but "${end[0]}" found.`, end[1]);
      }

      // Check multi-return syntax
      if (multiReturn !== null) {
        if (multiReturn.length === 0) {

        } else {
          multiReturn.forEach(param => { if (param.type === 'EmptyExpression') { addProblem('Return variable not defined.', param.loc); } });
        }
      }

      // Check input parameters and their separators (comma).
      if (reqParams.length === 0) {
        // In case required parameters are not provided
        if (optParams === null) {
          // Do nothing if neither required parameters or optional parameters are provided
        } else if (optParams.params.length === 0) {
          // If bracket exists but nothing in it, report an erro.
          addProblem('No optional parameters defined in brackets.', optParams.loc);
        } else {
          // Otherwise, report error if empty element exists.
          optParams.params.forEach(param => { if (param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); } });
        }
      } else {
        // In cae one or more required parameters exist
        if (optParams === null) {
          // If no brackets exists, simply check an empty element and report it.
          reqParams.forEach(param => { if (param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); } });
        }  else if (optParams.params.length === 0) {
          // If brackets exists but nothing in it, simply check an empty element and report it. The last comma outside the bracket is valid.
          reqParams.forEach((param, i, params) => { if (i !== params.length - 1 && param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); } });
          addProblem('No optional parameters defined in brackets.', optParams.loc);
        } else {
          // If both required parameters and optional parameters are provided, check the both.
          reqParams.forEach((param, i, params) => { if (i !== params.length - 1 && param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); } });
          optParams.params.forEach((param, i, params) => { if (i !== 0 && param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); } });
          if (reqParams[reqParams.length - 1].type === 'EmptyExpression' && optParams.params[0].type === 'EmptyExpression') {
            addProblem('Duplicated commas.', optParams.params[0].loc, DiagnosticSeverity.Warning);
          } else if (reqParams[reqParams.length - 1].type !== 'EmptyExpression' && optParams.params[0].type !== 'EmptyExpression') {
            addProblem('Missing comma between required parameters and optional parameters.', getRange(optParams.loc.source, optParams.loc.start, 1, 0), DiagnosticSeverity.Warning);
          }
        }
      }
      return { type: 'FunctionDeclaration', id: id, threadsafe: !!ts, override: !!or, static: !!s0, params: reqParams, optParams: optParams?.params, return: multiReturn, body: body, subtype: subtype, loc: location(), interceptingComment: iComment, };
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
    _0 @(Directive / IfStmt / SwitchStmt / TryStmt / DoWhileStmt / ForStmt / ForInStmt / BreakStmt / ContinueStmt / MultCmndStmt / EmptyEolStmt / EmptyEofStmt / EmptyAboveEndStmt / InvalidFuncStmt)
    // _0 @(UnclassifiedEolStmt / EmptyEolStmt / EmptyEofStmt)
  ) {
    return leadingCommentsAddedNode(funcStmt, lComments);
  }
  /
  // _0 @(UnclassifiedEolStmt / EmptyEolStmt)
  _0 @(Directive / IfStmt / SwitchStmt / TryStmt / DoWhileStmt / ForStmt / ForInStmt / BreakStmt / ContinueStmt / MultCmndStmt / EmptyEolStmt / InvalidFuncStmt)
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
    ) _1 declarations:StructMemberDeclr|1.., Comma| {
        node0.declarations = declarations;
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
      'if'i _0 '(' _0 test0:BaseExpr _0 ')' _0 iComment0:EolWWOComment consequent0:FuncStmt* {
        return { type: 'IfCase', test: test0, consequent: consequent0, interceptingComment: iComment0, loc: location(), };
      }
    ) elseifCases:(
      _0 'elseif'i _0 '(' _0 testI:BaseExpr _0 ')' _0 iCommentI:EolWWOComment consequentI:FuncStmt* {
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
    kind:$('str'i? 'switch'i) _0 '(' _0 discriminant:BaseExpr _0 ')' _0 iComment:EolWWOComment stmtsBeforeCase:FuncStmt* cases:(
      _0 'case'i _1 test:(StringLiteral / SignedNumericLiteral / StdId) ':' _0 iCommentI:EolWWOComment consequent:FuncStmt* {
        return { type: 'SwitchCase', test, consequent, interceptingComment: iCommentI, loc: location(), };
      }
      /
      _0 'default'i _0 ':'_0 iCommentI:EolWWOComment consequent:FuncStmt* {
        return { type: 'SwitchCase', test: null, consequent, interceptingComment: iCommentI, loc: location(), };
      }
    )* _0 end:End {
      if (end[0].toLowerCase() !== 'endswitch') { error(`Expected "endswitch" but "${end[0]}" found.`, end[1]); }
      if (stmtsBeforeCase) {
        stmtsBeforeCase.forEach(stmt => { if (stmt.type !== 'EmptyStatement') { addProblem('Statement not allowed here.', stmt.loc); } });
      }

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

ForStmt 'for-loop' =
  node:(
    // TODOS: not strict rule
    'for'i _0 '(' _0 init:CommaSepAssignUpdateExpr? _0 ';' _0 test:BaseExpr? _0 ';' _0 update:CommaSepAssignUpdateExpr? _0 ')' _0 iComment:EolWWOComment body:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'endfor') { error(`Expected "endfor" but "${end[0]}" found.`, end[1]); }
      return { type: 'ForStatement', init, test, update, body, interceptingComment: iComment, loc: location(), }; 
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

ForInStmt 'range-based for-loop' =
  node:(
    // TODOS: not strict rule
    'for'i _0 '(' _0 left:VariableWWOType? _0 ':' _0 right:BaseExpr _0 ')' _0 iComment:EolWWOComment body:FuncStmt* _0 end:End {
      if (end[0].toLowerCase() !== 'endfor') { error(`Expected "endfor" but "${end[0]}" found.`, end[1]); }
      return { type: 'ForInStatement', left: left, right: right, interceptingComment: iComment, loc: location(), }; 
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

CommaSepAssignUpdateExpr 'comma-separated assignment or update expressions' =
  // TODOS: currently the returned value is not an AST object.
  (AssignExpr / UpdateExpr)|.., Comma|

VariableWWOType 'variable with or without type' =
  // TODOS: not strict rule
  kind:$('FUNCREF'i / 'STRUCT'i) _0 proto:StdName _0 declarator:Declarator {
    return { type: 'VariableDeclaration', kind: kind.toLowerCase(), proto, declarations: [declarator] };
  }
  /
  kind:$('u'i? ('char'i / 'int'i ('16' / '32' / '64')?) / 'float'i / 'double'i) _1 declarator:Declarator {
    return { type: 'VariableDeclaration', kind: kind.toLowerCase(), declarations: [declarator] };
  }
  /
  kind:$('Variable'i / 'String'i / 'Wave'i / 'NVAR'i / 'SVAR'i / 'DFREF'i) option:(_0 '/' @$[a-zA-Z0-9]+)* _1 declarator:Declarator {
    return { type: 'VariableDeclaration', kind: kind.toLowerCase(), option, declarations: [declarator] };
  }
  /
  StdId

/* 
 * Comma-separated variables. The element may be empty.
 * e.g., 
 * '' : 0 element
 * 'a': 1 element
 * 'a,b': 2 elements
 * ',': 2 empty elements
 * 'a,b,`: 3 elements including 1 empty element
 */
VariableList =
  heads:(VariableWWOType? CommaWithLoc)|..| tail:VariableWWOType? {
    const nodesList = [];
    for (let i = 0; i < heads.length; i++) {
      const [node, commaLoc] = heads[i];
      nodesList.push(node ?? { type: 'EmptyExpression', loc: commaLoc, });
    }
    if (tail) {
      nodesList.push(tail);
    } else if (heads.length > 0) {
      nodesList.push({ type: 'EmptyExpression', loc: heads[heads.length - 1][1], });
    }
    return nodesList;
  }

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

MultCmndStmt 'multiple commands statement' =
  !End node:(
    args:(
      ';' { return { type: 'EmptyStatement', loc: location(), }; }
      /
      @(
        ReturnStmt / DeclStmt / AssignStmt / OpStmt / @UpdateExpr _0 &(Eol / ';' / '//') / @CallExpr _0 &(Eol / ';' / '//')
      ) (_0 ';')?
    )|1.., _0| {
      // return (args.length === 1) ? args[0] : { type: 'MultipleStatement', args, loc: location(), };
      if (args.length === 1) {
        if (args[0].type === 'EmptyStatement') { addProblem('Empty statement.', args[0].loc, DiagnosticSeverity.Information); }
        return args[0];
      } else {
        args.forEach(arg => {
          if (arg.type === 'EmptyStatement') { addProblem('Empty statement.', arg.loc, DiagnosticSeverity.Information); }
        });
        return { type: 'MultipleStatement', args, loc: location(), };
      }
    }
  ) _0 tComment:EolWWOComment {
    return trailingCommentAddedNode(node, tComment);
  }

// > DisplayHelpTopic "Multiple Return Syntax"
ReturnStmt 'return statement' =
  'Return'i args:(_0 @(
    BaseExpr
    /
    '[' _0 elements:BaseExpr|.., Comma| exComma:CommaWithLoc? _0 ']' {
      if (exComma) { addProblem('Trailing comma not allowed.', exComma); };
      return { type: 'ArrayExpression', elements, };
    } 
  )? _0 &(Eol / ';' / '//')
) {
    return { type: 'ReturnStatement', arguments: args, };
  }

DeclStmt 'declaration statement' =
  node0:(
    kind:$('u'i? ('char'i / 'int'i ('16' / '32' / '64')?) / 'float'i / 'double'i) {
      return { type: 'VariableDeclaration', kind: kind.toLowerCase(), loc: location(), };
    }
    / 
    kind:$('Variable'i / 'String'i / 'Wave'i / 'NVAR'i / 'SVAR'i / 'DFREF'i) flags:(_0 @Flag)* {
      return { type: 'VariableDeclaration', kind: kind.toLowerCase(), loc: location(), flags, };
    }
    /
    kind:$('FUNCREF'i / 'STRUCT'i) flags:(_0 @Flag)* _1 proto:StdName {
      return { type: 'VariableDeclaration', kind: kind.toLowerCase(), loc: location(), proto, flags, };
    }
  ) _1 elements:DeclaratorWWOInit|1.., Comma| exComma:CommaWithLoc? _0 &(Eol / ';' / '//') {
    if (exComma) { addProblem('Trailing comma not allowed.', exComma); };
    if (/^(?:char|uchar|int(?:16|32)|uint(?:16|32)?)$/.test(node0.kind)) {
      addProblem('This type is available only for structure, not for function.', node0.loc);
    }
    node0.declarations = elements;
    node0.loc = location();
    return node0;
  }

Declarator 'variable delarator' =
  pbr:(@'&' _0)? name:StdName {
    return { type: 'VariableDeclarator', id: name, init: null, pbr: pbr === '&', };
  }

DeclaratorWWOInit 'variable delarator with or without initialization' =
  '&' name:StdName { return { type: 'VariableDeclarator', id: name, init: null, pbr: true, }; }
  /
  name:PathExpr init:(_0 '=' _0 @BaseExpr)? {
    return { type: 'VariableDeclarator', id: name, init, pbr: false, };
  }

AssignStmt 'assignment statement' =
  // Assignment statement does not exist in the original AST.
  multiThread:('MultiThread'i (_0 @Flag)* _1)?
  left:LValue _0 op:$('=' !'=' / '+=' / '-=' / '*=' / '/=' / ':=') _0 right:(BraceListExpr / BaseExpr) _0 &(Eol / ';' / '//') {
    return { type: 'AssignmentStatement', op, left, right, multiThread: !!multiThread, };
  }

AssignExpr 'assignment expression' =
  left:LValue _0 operator:$('=' !'=' / '+=' / '-=' / '*=' / '/=' / ':=') _0 right:(BraceListExpr / BaseExpr) {
    return { type: 'AssignmentExpression', operator, left, right, multiThread: false, };
  }


OpStmt 'operation statement' =
  name:$([a-zA-Z][a-zA-Z0-9]*) &{ return operationRegExp.test(name); } flags:(_0 @Flag)* args:(
    Flag+ / Word+ / StringLiteral / _1 / !(Eol / ';' / '//') .)* {
    // TODOS: object properties
    return { type: 'ExOperationStatement', name, args, };
  }
  // name:$([a-zA-Z][a-zA-Z0-9]*) &{ return operationRegExp.test(name); } flags:(_0 @Flag)* args:(
  //   (_0 ',' _0 / _1) @(
  //     BaseExpr (_0 '=' _0 (BaseExpr / BraceListExpr / ParenListExpr / BracketListExpr+))?
  //     /
  //     BraceListExpr
  //     /
  //     Word+
  //   )
  //   /
  //   (_0 @Flag)+
  // )* _0 &(Eol / ';' / '//') {
  //   // TODOS: object properties
  //   return { type: 'ExOperationStatement', name, flags, args, };
  // }

// list of values surrounded with braces ('{}')
BraceListExpr 'list of values' =
  '{' _0 elements:(BraceListExpr / BaseExpr)|1.., Comma| _0 '}' {
    return { type: 'ArrayExpression', elements, exkind: 0, };
  }

// list of values surrounded with parentheses ('()')
ParenListExpr 'list of values' =
  '(' _0 elements:(BraceListExpr / BaseExpr)|1.., Comma| _0 ')' {
    return { type: 'ArrayExpression', elements, exkind: 1, };
  }

// list of values surrounded with brackets ('[]')
BracketListExpr '' =
  '[' _0 elements:(BraceListExpr / BaseExpr / '')|.., Comma| _0 ']' {
    return { type: 'ArrayExpression', elements, exkind: 2, };
  }

//
RefExpr 'reference expression' =
  '$' _0 arg:Factor {
    return { type: 'ReferenceExpression', arg: arg, };
  }

BaseExpr =
  RefExpr / Order8

// logical AND, OR and conditional (aka ternery) operator
// evaluated from left to right; e.g., `1 ? 2 : 3 ? 4 : 5` returns 4, not 2.
// Unlike C and other several languages, AND and OR have the same priority.
Order8 =
  head:Order7 tails:(_0 ('&&' / '||') _0 Order7 / _0 '?' _0 Order7 _0 ':' _0 Order7)* {
    return tails.reduce((accumulator, currentValue) => {
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
  heads:(Order6 _0 $('&' !'&' / '|' !'|' / '%^' / '%&' / '%|') _0)* tail:Order6 {
    return heads.reduceRight((accumulator, currentValue) => {
      if (currentValue[2] === '%&' || currentValue[2] === '%|') {
        let loc = location();
        if ('loc' in currentValue[0]) {
          loc = getRange(loc.source, loc.start, 2, currentValue[0].loc.end.offset - currentValue[0].loc.start.offset + currentValue[1].length);
        }
        addProblem('Obsolete bit-wise binary operator.', loc, DiagnosticSeverity.Information);
      }
      return { type: 'BinaryExpression', op: currentValue[2], left: currentValue[0], right: accumulator, };
    }, tail);
  }

// ObsoleteBitwiseBinary =
//   a: $('%&' / '%|') {
//     addProblem('Obsolete bit-wise binary operator.', location(), DiagnosticSeverity.Information);
//     return a;
//   }


// comparison: '==', '!=', '>', '<', '>=', '<='
// evaluated from right to left; e.g, `2==1>= 0` returns 0, not 1.
Order6 =
  heads:(Order5 _0 $('==' / '!=' / '>' !'>' '='? / '<' !'<' '='?) _0)* tail:Order5 {
    return heads.reduceRight((accumulator, currentValue) => {
      return { type: 'BinaryExpression', op: currentValue[2], left: currentValue[0], right: accumulator, };
    }, tail);
  }

// addition or string concatenation, and subtraction: '+', '-'
// evaluated from left to right.
Order5 =
  head:Order4 tails:(_0 $('+' / '-') _0 Order4)* {
    return tails.reduce((accumulator, currentValue) => {
      return { type: 'BinaryExpression', op: currentValue[1], left: accumulator, right: currentValue[3], };
    }, head);
  }

// multiplication and division: '*', '/'
// evaluated from left to right.
Order4 =
  head:Order3 tails:(_0 $('*' / '/') _0 !(Word+ _0 '=') Order3)* {
    return tails.reduce((accumulator, currentValue) => {
      return { type: 'BinaryExpression', op: currentValue[1], left: accumulator, right: currentValue[4], };
    }, head);
  }

// negation, logical complement, bitwise complement: '-', '!', '~'.
// evaluated from left to right.
// The extension author adds '+' (without preceding parameter) in this order.
Order3 =
  heads:($('!' / '~' / '-' ! '-'/ '+' ! '+' / '%~') _0)* tail:Order2 {
    return heads.reduceRight((accumulator, currentValue) => {
      if (currentValue[0] === '%~') {
        const loc = location();
        addProblem('Obsolete bit-wise unary operator.', getRange(loc.source, loc.start, 2, 0), DiagnosticSeverity.Information);
      }
      return { type: 'UnaryExpression', op: currentValue[0], arg: accumulator, };
    }, tail);
  }

// exponentiation, bitwise left shift, bitwise right shift: '^', '<<', '>>'.
// evaluated from left to right.
//
// There is a special rule for exponentiation (^):
// exponentation binds less tightly than an arithmetic or bitwise unary operator on its right.
// Owing to this rule, expression such as 2^-2 is allowed.
Order2 =
  head:Order1 tails:(
    _0 op:('^' / '<<' / '>>') _0 right:Order1 {
      return { op, right, };
    }
    /
    _0 op:'^' _0 uos2:(@$('!' / '~' / '-' ! '-'/ '+' ! '+' / '%~') _0)+ right2:Order1 {
      const right = uos2.reduceRight((accumulator, currentValue) => {
        if (currentValue[0] === '%~') {
          const loc = location();
          addProblem('Obsolete bit-wise unary operator.', getRange(loc.source, loc.start, 2, 0), DiagnosticSeverity.Information);
        }
        return { type: 'UnaryExpression', op: currentValue, arg: accumulator, };
      }, right2);
      return { op, right, } ; 
    }
  )* {
    return tails.reduce((accumulator, currentValue) => {
      return { type: 'BinaryExpression', op: currentValue.op, left: accumulator, right: currentValue.right, };
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
  '(' _0 @BaseExpr _0 ')'
  / NumericLiteral / StringLiteral / CallExpr / Variable

UpdateExpr =
  op:('++' / '--') _0 arg:(StdId / LiberalId) {
    return { type: 'Gession', op: op, arg: arg, prefix: true, };
  }
  /
  arg:(StdId / LiberalId) _0 op:('++' / '--') {
    return { type: 'UpdateExpression', op: op, arg: arg, prefix: false, };
  }

CallExpr 'function call' =
  callees:(@(StdId / LiberalId) _0)|1.., '#' _0| '(' _0 args:FuncParam|.., Comma| _0')' !(_0 ('[' / '(')) {
    if (callees.length > 3) {
      addProblem('Too many "#"s.', location());
    }
    return { type: 'CallExpression', callee:callees[callees.length - 1] , modules: callees.slice(0, -1), arguments: args ?? [], loc: location(), };
  }

FuncParam 'function parameter' =
  left:StdId _0 '=' _0 right:BaseExpr {
    return { type: 'AssignmentStatement', operator: '=', left, right, };
  }
  /
  BaseExpr

Variable =
  object:(
    heads:(@ArrayElement _0 '.' _0)+ tail:ArrayElement _0 {
      return heads.reduce((accumulator, currentValue) => {
        return { type: 'MemberExpression', object: accumulator, property: currentValue, };
      }, tail);
    }
    /
    @PathExpr _0
  ) indexes:(
    '[' _0 rangeOrIndex:(@ArrayElementAccessor _0)? ']'_0 {
      if (rangeOrIndex) {
        rangeOrIndex.scaled = false;
      }
      return rangeOrIndex;
    }
    /
    '(' _0 rangeOrIndex:(@ArrayElementAccessor _0)? ')' _0 {
      if (rangeOrIndex) {
        rangeOrIndex.scaled = true;
      }
      return rangeOrIndex;
    }
    /
    '#' _0 BaseExpr
  )* {
    if (indexes && indexes.length !== 0) {
      return { type: 'ExArrayElementExpression', object, indexes, };
    } else {
      return object;
    }
  }

/*
Identifiers connected by a dot. e.g., `mystruct0.mss[0].wv[0]`

```
Structure MyStruct
  STRUCT MySubStruct mss[2]
EndStructure

Structure MySubStruct
  WAVE wv[2]
EndStructure

Function test()
	WAVE wave2
	Make/FREE/N=3 fw
	fw = p

	STRUCT MyStruct mystruct0
	STRUCT MySubStruct mss0
	WAVE mss0.wv[0] = fw
	mystruct0.mss[0] = mss0

  WAVE w = mystruct0.mss[0].wv[0]
End
```
*/

ArrayElement =
  object:(StdId / LiberalId) index:(_0 '[' _0 @BaseExpr _0 ']')? {
    if (index) {
      return { type: 'ExArrayElement', object, index, };
    } else {
      return object;
    }
  }

PathExpr 'path expression' =
  heads:(@(RefExpr / StdId / LiberalId)? ':')+ tail:(RefExpr / StdId / LiberalId)? {
    return { type: 'ExPathExpression', paths: [...heads, tail], loc: location(), };
  }
  /
  RefExpr / StdId / LiberalId

LValue =
  Variable
  /
  '[' _0 elements:VariableWWOType|.., Comma| _0 ']' {
    return { type: 'ArrayExpression', elements, };
  }

/* 
Expression used to access elements of an array-like object (wave and structure member),
which appears inside braces or parentheses.
For example: wave0[*], wave1(1.5), wave2[1, 7; 2], mystruct.mybytes[2]

- wildcard and empty, e.g., `wave0[*]`, wave1()`
  - left value only.
  - both point number and scaled index.
- subrange (slice), e.g., `wave0[1, 7; 2]`.
  - left value only.
  - both point number and scaled index.
  - Label can be used for `start` and `end`.
  - `start` can be empty or a label.
  - `end` can be either empty, a number, label, or wildcard `*`.
- label, e.g., `wave0[1][%red]`
  - both left and right values
  - used with braces only, not with parentheses
*/
ArrayElementAccessor =
  start:LabelOrIndex _0 extra:(
    end:ArrayElemEnd inc:ArrayElemInc? { return { end, inc, }; }
    /
    inc:ArrayElemInc { return { end: null, inc, }; }
  )? {
    if (extra) {
      checkWaveElemInc(extra.inc);
      return { type: 'ExWaveSubrange', start, end: extra.end, inc: extra.inc, };
    } else {
    return { type: 'ExElementIndex', arg: start, };
    }
  }
  /
  end:ArrayElemEnd inc:ArrayElemInc? {
    checkWaveElemInc(inc);
    return { type: 'ExWaveSubrange', start: null, end, inc, };
  }
  /
  inc:ArrayElemInc {
    checkWaveElemInc(inc);
    return { type: 'ExWaveSubrange', start: null, end: null, inc, };
  }

LabelOrIndex = 
  '*' { return { type: 'Literal', value: Infinity, raw: '*', loc: location(), }; }
  /
  label:(@'%' _0)? arg:BaseExpr {
    if (label) {
      return { type: 'ExDimensionLabel', arg: arg, loc: location(), };
    } else {
      return arg;
    }
}

ArrayElemEnd =
  ',' _0 end:(@LabelOrIndex _0)? {
    const loc = location();
    return end ?? { type: 'Literal', value: '', raw: '', loc: getRange(loc.source, loc.start, 0, 1), };
  }

ArrayElemInc = ';' _0 inc:(@LabelOrIndex _0)? {
  const loc = location();
    return inc ?? { type: 'Literal', value: '', raw: '', loc: getRange(loc.source, loc.start, 0, 1), };
  }

StdName 'standard name' =
  // $[a-zA-Z0-9_]+
  [a-zA-Z][a-zA-Z0-9_]* { return text(); }

StdId 'standard identifier' =
  name:StdName {
    return { type: 'Identifier', name: name, kind: 'strict', loc: location(), };
  }

LiberalName 'liberal name' =
  // "'" @$[^'";:]* "'"
  "'" str:$[^'";:]* "'" { return str; }

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
    return { type: 'Literal', value: String.fromCodePoint(parseInt(body, 16)), raw: text(), loc: location(), };  }

StringId 'string identifier' =
  name:StringRaw {
    return { type: 'Identifier', name: name, kind: 'string', loc: location(), };
  }

Flag 'operation flag' =
  // '/' _0 key:$[a-zA-Z][a-zA-Z0-9]* value:(_0 '=' _0 @(BraceListExpr / ParenListExpr / BracketListExpr+ / SignedNumericLiteral / StringLiteral / CallExpr / RefExpr / Variable))? {
  '/' _0 key:$[a-zA-Z][a-zA-Z0-9]* value:(_0 '=' _0 @(BraceListExpr / ParenListExpr / BracketListExpr+ / BaseExpr))? {
    return { type: 'ExFlag', key, value, };
  }
