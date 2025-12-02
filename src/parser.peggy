{{
// A JavaScript file is type-checked when the following line is
// at the first line of the file.
// @ts-check

/**
 * JSDoc-style type definitions.
 * @typedef { import('./parser').LocationRange } LocationRange
 * @typedef { import('./parser').Location } Location
 * @typedef { import('./parser').GrammarSource } GrammarSource

 * @typedef { import('./tree').BaseStatement } BaseStatement
 * @typedef { import('./tree').BaseBlock } BaseBlock
 * @typedef { import('./tree').Comment } Comment
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

const strictOperationRegExp = new RegExp(
  '^(Make)$', 'i'
);

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
  + 'ICA|IFFT|Image(?:AnalyzeParticles|Blend|BoundaryToMask|Composite|EdgeDetection|FileInfo|Filter|Focus|FromXYZ|GenerateROIMask|GLCM|HistModification|Histogram|Interpolate|LineProfile|Load|Morphology|Registration|RemoveBackground|Restore|Rotate|Save|SeedFill|Skeleton3d|Snake|Stats|Threshold|Transform|UnwrapPhase|Window)|IndexSort|InsertPoints|InstantFrequency|Integrate(?:2D|ODE)?|Interp(?:olate(?:2|3D)|3DPath|4DPath)|'
  + 'JCAMPLoadWave|JointHistogram|'
  + 'Kill(?:Background|Control|DataFolder|FIFO|FreeAxis|Path|PICTs|Strings|Variables|Waves|Window)|KMeans|'
  + 'Label|Layout(?:PageAction|SlideShow)?|Legend|LinearFeedbackShiftRegister|ListBox|Load(?:Data|PackagePreferences|PICT|Wave)|Loess|LombPeriodogram|'
  + 'Make(?:Index)?|MarkPerfTestTime|Matrix(?:Balance|Convolve|Corr|EigenV|Factor|Filter|GaussJ|GLM|Inverse|LinearSolve(?:TD)?|LLS|LUBkSub|LUD(?:TD)?|Multiply(?:Add)?|OP|ReverseBalance|Schur|Solve|Sparse|SVBkSub|SVD|Transpose)|MeasureStyledText|MLLoadWave|Modify(?:BoxPlot|Browser|Camera|Contour|Control(?:List)?|FreeAxis|Gizmo|Graph|Image|Layout|Panel|Procedure|Table|ViolinPlot|Waterfall)?|Move(?:DataFolder|File|Folder|String|Subwindow|Variable|Wave|Window)|MultiTaperPSD|MultiThreadingControl|'
  + 'NeuralNetwork(?:Run|Train)|New(?:Camera|DataFolder|FIFO(?:Chan)?|FreeAxis|Gizmo|Image|Layout|Movie|Notebook|Panel|Path|Waterfall)|Note(?:book(?:Action)?)?|'
  + 'Open(?:Help|Notebook)?|Optimize|'
  + 'ParseOperationTemplate|PathInfo|Pause(?:ForUser|Update)|PCA|Play(?:Movie(?:Action)?|Sound)|PolygonOp|Popup(?:ContextualMenu|Menu)|Preferences|PrimeFactors|Print(?:f|Graphs|Layout|Notebook|Settings|Table)?|Project|PulseStats|PutScrapText|Python(?:Env|File)?|pwd|'
  + 'Quit|'
  + 'RatioFromNumber|Redimension|Remez|Remove(?:Contour|From(?:Gizmo|Graph|Layout|Table)|Image|LayoutObjects|Path)?|Rename(?:DataFolder|Path|PICT|Window)?|Reorder(?:Images|Traces)|Replace(?:Text|Wave)|Resample|ResumeUpdate|Reverse|Rotate|'
  + 'Save(?:Data|Experiment|GizmoCopy|GraphCopy|Notebook|PackagePreferences|PICT|TableCopy)?|Say|Set(?:ActiveSubwindow|Axis|Background|DashPattern|DataFolder|DimLabel|Draw(?:Env|Layer)|FileFolderInfo|Formula|IdlePeriod|Igor(?:Hook|MenuMode|Option)|Marquee|ProcessSleep|RandomSeed|Scale|Variable|Wave(?:Lock|TextEncoding)|Window)|Show(?:IgorMenus|Info|Tools)|Silent|Sleep|Slider|Smooth(?:Custom)?|Sort(?:Columns)?|Sound(?:In(?:Record|Set|StartChart|Status|StopChart)|LoadWave|SaveWave)|Spherical(?:Interpolate|Triangulate)|Split(?:String|Wave)|sprintf|sscanf|Stack(?:Windows)?|Stats(?:AngularDistanceTest|ANOVA(?:1|2(?:NR|RM)?)Test|ChiTest|Circular(?:CorrelationTest|Means|Moments|TwoSampleTest)|CochranTest|ContingencyTable|DIPTest|DunnettTest|FriedmanTest|FTest|HodgesAjneTest|JBTest|KDE|KendallTauTest|KSTest|KWTest|Linear(?:CorrelationTest|Regression)|MultiCorrelationTest|NP(?:MCTest|NominalSRTest)|Quantiles|RankCorrelationTest|Resample|Sample|ScheffeTest|ShapiroWilkTest|SignTest|SRTest|TTest|TukeyTest|VariancesTest|Watson(?:USquaredTest|WilliamsTest)|WheelerWatsonTest|WilcoxonRankTest|WRCorrelationTest)|STFT|String|Struct(?:Fill|Get|Put)|Sum(?:Dimension|Series)|'
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
   * @template {BaseStatement} T
   * @param {T} node - The node to which the comments are added.
   * @param {Comment[] | null | undefined} comments - The comments to be added.
   * @returns {T} - The node with the added comments.
   */
  function addLeadingCommentsToNode(node, comments) {
      if (comments && comments.length !== 0) {
      node.leadingComments = comments;
    }
    return node;
  }

  /**
   * Add a trailing comment to a node, it it exists.
   * @template {BaseStatement} T
   * @param {T} node - The node to which the comments are added.
   * @param {Comment | null | undefined} comment - The comments to be added.
   * @returns {T} - The node with the added comment.
   */
  function addTrailingCommentToNode(node, comment) {
    if (comment) {
      node.trailingComment = comment;
    }
    return node;
  }

  /**
   * Throw an error with a message and location.
   * @template {BaseBlock} T
   * @param {T} node - The node to which the comments are added.
   * @param {{label: string, comment: Comment | null, loc: LocationRange } | null} end - The end pattern of the node. `null` if not found.
   * @param {string} expectedEndLabel - The expected label to close block.
   * @param {string} blockLabel - The expected label to close block.
   * @param {Comment | null | undefined} innerComment - inner comment to be added to the node.
   * @returns {T} - The modified node with the end pattern applied.
   */
  function modifyNodeUsingEndPattern(node, end, expectedEndLabel, blockLabel, innerComment = undefined) {
    const nodeLoc = node.loc ?? location();
    if (end) {
      // Add trailing comment if it exists.
      if (end.comment) {
        node.trailingComment = end.comment;
      }
      // Adjust the `end` location of the node.
      const endLoc = { line: end.loc.start.line, column: end.loc.start.column + end.label.length, offset: end.loc.start.offset + end.label.length };
      node.loc = { source: nodeLoc.source, start: nodeLoc.start, end: endLoc };
      // Add inner comment if it exists.
      if (innerComment) {
        node.innerComments = [innerComment];
      }
    } else {
      // Report a problem if the end label is not found.
      addProblem(`Expected ${expectedEndLabel} for ${blockLabel} but not found.`, nodeLoc);
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

Program = body:ParentStmt* {
  return { type: 'Program', body, problems, };
}

/** a whitespace, horizontal tab or line-continuation. */
_Space = [ \t] / ('//' (!(_Eol / '\\' _Eol) .)* )? '\\' _Eol
/** Zero or more whitespaces, horizontal tabs and line-continuations. */
_0 = _Space* { return text(); }
/** One or more whitespaces, horizontal tabs and line-continuations. */
_1 = _Space+ { return text(); }

_Comma = _0 ',' _0
_CommaWLoc = _0 ',' _0 { return location(); }

/** EOL (End of line). */
_Eol = ('\n' / '\r\n' / '\r') {}
/** EOF (End of file). */
_Eof = !. {}

Comment 'line comment' =
  @(
    '//' '/'? [ \t]? p:$(!_Eol .)* { return { type: 'Line', value: p, loc: location(), }; }
  ) (_Eol / _Eof)

/** End of line with or without a trailing line comment. */
EolWWOComment = (';' _0)? p:(_Eol / _Eof / Comment) { return p ? p : undefined; }
/** Simplified version of end of statement for lookahead ('&' and '!'). */
_EosLA = _Eol / _Eof / Comment / ';' {}

// commonly used statements

/** Empty statement that ends with EOL. */
EmptyEolStmt 'empty statement that ends with EOL' =
  _Eol { const loc = location(); loc.end = loc.start; return { type: 'EmptyStatement', loc, }; }

/** Empty statement that ends with EOF. */
EmptyEofStmt 'empty statement that ends with EOF' =
  _Eof { return { type: 'EmptyStatement', loc: location(), }; }

// top-level statements
ParentStmt 'top-level statement' =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(ParentStmtBase / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 @ParentStmtBase
  /
  _1 @EmptyEofStmt


_CommonEnd =
  label:'End'i _0 comment:EolWWOComment {
    return { label, comment, loc: location() };
  }

/**
 * Empty statement always created without text consumption.
 * Typically used in the form: `&_CommonEnd CommonEmptyStmt` to consume
 * line comments just above the end of the block.
 */
BaseEmptyStmt =
  &{ return true; } { return { type: 'EmptyStatement', loc: location(), }; }

/**
 * Empty statement created with any text until the end of line consumed.
 * Fails only when no characters are found until the end of line or comment.
 * Typically used in the form: `!_CommonEnd CommonInvalidStmt` to consume
 * lines not parsed by the other rules.
 */
BaseInvalidStmt =
  value:$(!EolWWOComment .)+ trailingComment:EolWWOComment {
    const node = { type: 'UnclassifiedStatement', value, loc: location(), trailingComment, };
    addProblem('Invalid statement.', node.loc);
    return node;
  }

DirectiveStmt 'directive' =
  // TODO: parse values
  '#' directive:'include'i _0 arg:(
    '"' str:$('\\' . / [^"])* '"' { return [false, str, location()]; }
    /
    '<' str:$('\\' . / [^>])* '>' { return [true, str, location()]; }
  ) trailingComment:EolWWOComment {
    const strId = { type: 'Identifier', name: arg[1], kind: 'string', loc: arg[2] };
    return { type: 'DirectiveStatement', directive: 'include', kind: 'include', builtin: arg[0], argument: strId, loc: location(), trailingComment, };
  }
  /
  '#' directive:_StdName _0 expression:$(!EolWWOComment .)* trailingComment:EolWWOComment {
    return { type: 'DirectiveStatement', directive, kind: 'unclassified', expression, loc: location(), trailingComment, };
  }

// top-level declarations, derivatives, and some other invalid statements.
ParentStmtBase =
  DirectiveStmt / ConstDecl / MenuDecl / PictDecl / StructDecl / MacroDecl / FuncDecl / EmptyEolStmt
  /
  node: InFuncStmt { addProblem('Invalid as top-level context. Move into function declaration.', node.loc, DiagnosticSeverity.Warning); return node; }
  /
  BaseInvalidStmt

ConstDecl 'constant declaration' =
  // TODO: parse a value
  or:('Override'i _1)? s0:('Static'i _1)? kind:$('Str'i ? 'Constant'i) flag:(_0 @FlagWOValue)? _1 id:StdId _0 '=' _0 rValue:_ConstDeclValue trailingComment:EolWWOComment {
    let kindInDecl;
    if (kind.toLowerCase() === 'strconstant') {
      if (flag) {
        addProblem('Flag not allowed in StrConstant declaration.', location());
      }
      kindInDecl = 'string';
    } else {
      if (flag) {
        if (flag.key.toUpperCase() === 'C') {
          kindInDecl = 'complex';
        } else {
          addProblem(`Unknown flag "/${flag.key}" in Constant declaration.`, flag.loc);
          kindInDecl = 'number';
        }
      } else {
        kindInDecl = 'number';
      }
    }
    if (rValue.kind !== kindInDecl) {
      addProblem(`Invalid value format: declared as ${kindInDecl} but assigned ${rValue.kind}.`, rValue.loc);
    }
    return { type: 'ConstantDeclaration', id, override: !!or, static: !!s0, kind: kindInDecl, value: rValue.value, raw: rValue.raw, trailingComment, loc: location() };
  }

_ConstDeclValue =
  s:_StrRaw _0 &EolWWOComment { return { kind: 'string', value: s, raw: text(), loc: location() }; }
  /
  n:_SignedNumLiteralRaw _0 &EolWWOComment { return { kind: 'number', value: n, raw: text(), loc: location() }; }
  /
  '(' _0 n1:_SignedNumLiteralRaw _0 ',' _0 n2:_SignedNumLiteralRaw _0 ')' _0 &EolWWOComment {
    return { kind: 'complex', value: [n1, n2], raw: text(), loc: location() };
  }
  /
  $(!EolWWOComment .)+ { return { kind: 'unknown', value: null, raw: text(), loc: location() }; }

MenuDecl 'menu declaration' =
  'Menu'i _1 id:StrId _0 options:(',' _0 @StdId _0 )* iComment:EolWWOComment
  body:InMenuStmt*
  _0 end:(_Eof / _CommonEnd) {
    const node = { type: 'MenuDeclaration', id, body, loc: location(), };
    options.forEach((option) => {
      if (option.name.toLowerCase() === 'dynamic') {
        node.dynamic = true;
      } else if (option.name.toLowerCase() === 'hideable') {
        node.hideable = true;
      } else if (option.name.toLowerCase() === 'contextualmenu') {
        node.contextualMenu = true;
      } else {
        addProblem(`Unknown menu option "${option.name}".`, option.loc);
      }
    });
    return modifyNodeUsingEndPattern(node, end, '"End"', '"Menu" declaration', iComment);
}

PictDecl 'picture declaration' =
  s0:('Static'i _1)? 'Picture'i _1 id:StdId _0 iComment:EolWWOComment
  body:InPictStmt*
  _0 end:(_Eof / _CommonEnd) {
    const ascii85Blocks = body.filter((stmt) => stmt.type === 'Ascii85Block');
    if (ascii85Blocks.length === 0) { addProblem('Expected ASCII85 block but not found.', location()); }
    else if (ascii85Blocks.length > 1) { addProblem('Expected only one ASCII85 block but found more.', location()); }

    const node = { type: 'PictureDeclaration', id, static: !!s0, body, loc: location(), };
    return modifyNodeUsingEndPattern(node, end, '"End"', '"Picture" declaration', iComment);
  }
 
StructDecl 'structure declaration' =
  s0:('Static'i _1)? 'Structure'i _1 id:StdId _0 iComment:EolWWOComment
  body:InStructStmt*
  _0 end:(_Eof / _StructEnd) {
    const node = { type: 'StructureDeclaration', id, static: !!s0, body, loc: location(), };
    return modifyNodeUsingEndPattern(node, end, '"EndStructure"', '"Structure" declaration', iComment);
  }

MacroDecl 'macro declaration' =
  kind:('Window'i / 'Macro'i / 'Proc'i) _1 id:StdId _0 '(' _0 params:VariableList _0 ')' _0 subtype:(':' _0 @_StdName _0)? iComment:EolWWOComment
  body:InFuncStmt*
  _0 end:(_Eof / _FuncEnd) {
    const node = { type: 'MacroDeclaration', id, kind: kind.toLowerCase(), params, body, subtype, loc: location(), };
    return modifyNodeUsingEndPattern(node, end, '"End" or "EndMacro"', '"Macro" declaration', iComment);
  }

FuncDecl 'function declaration' =
  // TODO: parse parameters
  // TODO: `ret` is not parsed.
  ts:('ThreadSafe'i _1)? or:('Override'i _1)? s0:('Static'i _1)? 'Function'i !_Word flag:(_0 @Flag)* _0 multiReturn:(
    _0 '[' _0 @VariableList _0 ']' _0
  )? id:StdId _0 '(' _0 reqParams:VariableList _0 optParams:(
    '[' _0 params:VariableList _0 ']' { return { params, loc: location(), }; }
  )? _0 ')' _0 subtype:(':' _0 @_StdName _0)? iComment:EolWWOComment
  body:InFuncStmt*
  _0 end:(_Eof / _FuncEnd) {
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
        // If bracket exists but nothing in it, report an error.
        addProblem('No optional parameters defined in brackets.', optParams.loc);
      } else {
        // Otherwise, report error if empty element exists.
        optParams.params.forEach(param => {
          if (param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); }
        });
      }
    } else {
      // In case one or more required parameters exist
      if (optParams === null) {
        // If no brackets exists, simply check an empty elements in required parameters.
        reqParams.forEach(param => {
          if (param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); }
        });
      } else {
        // If both required parameters and optional parameters are provided, check the both.
        // Comma between required parameters and optional parameters is optional. E.g.,
        // `f(a [b])`, `f(a, [b])`, `f(a[, b])` and `f(a, [, b])` are all valid. 

        if (optParams.params.length === 0) {
        // If brackets exists but nothing in it, simply check an empty element and report it. The last comma outside the bracket is valid.
          reqParams.forEach((param, i, params) => { if (i !== params.length - 1 && param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); } });
          addProblem('No optional parameters defined in brackets.', optParams.loc);
        } else {
          if (reqParams[reqParams.length - 1].type === 'EmptyExpression' && optParams.params[0].type === 'EmptyExpression') {
            addProblem('Duplicated commas.', optParams.params[0].loc, DiagnosticSeverity.Information);
          } else if (reqParams[reqParams.length - 1].type !== 'EmptyExpression' && optParams.params[0].type !== 'EmptyExpression') {
            addProblem('Missing comma between required parameters and optional parameters.', getRange(optParams.loc.source, optParams.loc.start, 1, 0), DiagnosticSeverity.Information);
          }
          // Eliminate empty expressions inserted by the parser.
          if (reqParams[reqParams.length - 1].type === 'EmptyExpression') { reqParams.pop(); };
          if (optParams.params[0].type === 'EmptyExpression') { optParams.params.shift(); };

          // Check empty expressions in both required and optional parameters.
          [...reqParams, ...optParams.params].forEach((param) => {
            if (param.type === 'EmptyExpression') { addProblem('Parameter not defined.', param.loc); }
          });
        }
      }
    }
    const node = { type: 'FunctionDeclaration', id, threadsafe: !!ts, override: !!or, static: !!s0, params: reqParams, optParams: optParams?.params, return: multiReturn, body, subtype, loc: location(), };

    // Use of `EndMacro` for `Function` can be found in several IPF files
    // WaveMetrics bundled with Igor Pro 9.
    // I think it is misuse and `End` is only allowed for `Function`.
    // 
    // To the contrary, it is clearly written in the official document 
    // that a `Macro` definition ends with either `End` or `EndMacro`.
    if (end && end.label.toLowerCase() === 'endmacro') {
      addProblem(`Expected "End" but "EndMacro" found.`, end.loc, DiagnosticSeverity.Warning);
    }
    return modifyNodeUsingEndPattern(node, end, '"End" or "EndMacro"', '"Function" declaration', iComment);
  }

// body of top-level statements

// Menu block ends with 'end' and thus common patterns are available.
InMenuStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_CommonEnd @InMenuStmtBase / &_CommonEnd @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_CommonEnd @InMenuStmtBase
  /
  _1 @EmptyEofStmt

InMenuStmtBase =
  SubmenuDecl / MenuItemStmt / MenuHelpStmt / EmptyEolStmt / BaseInvalidStmt

// Picture block ends with 'end' and thus common patterns are available.
InPictStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_CommonEnd @InPictStmtBase / &_CommonEnd @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); } /
  _0 !_CommonEnd @InPictStmtBase
  /
  _1 @EmptyEofStmt

InPictStmtBase =
  Ascii85Block / EmptyEolStmt / BaseInvalidStmt

InStructStmt 'statement in structure block' =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_StructEnd @InStructStmtBase / &_StructEnd @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_StructEnd @InStructStmtBase
  /
  _1 @EmptyEofStmt

InStructStmtBase =
  StructMemberDecl / EmptyEolStmt / BaseInvalidStmt

_StructEnd =
  label:'EndStructure'i _0 comment:EolWWOComment { return { label, comment, loc: location() }; }


InFuncStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_FuncEnd @InFuncStmtBase / &_FuncEnd @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_FuncEnd @InFuncStmtBase
  /
  _1 @EmptyEofStmt

InFuncStmtBase =
  DirectiveStmt / IfStmt / SwitchStmt / TryStmt / DoWhileStmt / ForStmt / ForInStmt / BreakStmt / ContinueStmt / OneLineCmndStmt / EmptyEolStmt / BaseInvalidStmt

_FuncEnd =
  label:$('End'i 'Macro'i?) _0 comment:EolWWOComment {
    return { label, comment, loc: location() };
  }

// statements in Menu declarations

SubmenuDecl 'submenu declaration' =
  'Submenu'i _1 id:StrId _0 iComment:EolWWOComment
  body:InMenuStmt*
  _0 end:(_Eof / _CommonEnd) {
    const node = { type: 'SubmenuDeclaration', id, body, loc: location(), };
    return modifyNodeUsingEndPattern(node, end, '"End"', '"Submenu" declaration', iComment);
  }

/**
 * Menu item statement (or menu help string).
 * 
 * format: _MenuItemString_[, _MnuIemFlag_][, _ExecutionText_]
 * _MenuItemString_: is typically string but can be an expression. Check `DisplayHelpTopic "Dynamic Menu Items"`.
 * _MenuItemFlag_: optional, only `/Q` is allowed.
 * _ExecutionText_: optional, one-line command statement.
 */
MenuItemStmt 'menu item statement' =
  !_CommonEnd _0 label:(StrId / BaseExpr) _0 flags:(',' @(_0 @FlagWOValue)+ _0)? option:(
    ',' _0 stmt:OneLineCmndStmt _0 { return { key: 'execution', statement: stmt }; }
    /
    comment:EolWWOComment { return { key: 'comment', comment }; }
  ) {
    const node = { type: 'MenuItemStatement', label, loc: location(), };
    flags?.forEach(flag => {
      if (flag.key.toUpperCase() === 'Q') {
        node.quite = true;
      } else {
        addProblem(`Unknown menu item flag "/${flag.key}".`, flag.loc);
      }
    });
    if (option.key === 'execution') {
      node.execution = option.statement;
    } else if (option.key === 'comment') {
      addTrailingCommentToNode(node, option.comment);
  }
  return node;
}

MenuHelpStmt 'menu help statement' =
  !_CommonEnd _0 'help'i _0 '=' _0 '{' _0 messages:(BaseExpr|.., _Comma|) _0 '}' _0 comment:EolWWOComment {
    const node = { type: 'MenuHelpStatement', messages, loc: location(), };
    return addTrailingCommentToNode(node, comment);
  }

// statements in Picture declarations

Ascii85Block 'ASCII85 block' =
  'ASCII85Begin'i _0 iComment:EolWWOComment
  raw:(_0 !_Ascii85BlockEnd @$[^ \r\n]+ _0 _Eol)*
  _0 end:(_Eof / _Ascii85BlockEnd) {
  const node = { type: 'Ascii85Block', raw, loc: location(), };
  return modifyNodeUsingEndPattern(node, end, '"ASCII85End"', 'ASCII85 block', iComment);
}

_Ascii85BlockEnd =
  label:'ASCII85End' _0 comment:EolWWOComment {
    return { label, comment, loc: location() };
  }

// statements in Structure declarations

// TODO: Array element is not checked. It may be a literal number, constant, or mathematical operation of them.
StructMemberDecl 'structure member declaration'=
  stmtNode:(
    node0:(
      kind:$('u'i? ('char'i / 'int'i ('16' / '32' / '64')) / 'float'i / 'double'i) {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), loc: location(), };
      }
      / 
      kind:$('Variable'i / 'String'i / 'Wave'i / 'NVAR'i / 'SVAR'i / 'DFREF'i) flags:(_0 @FlagWOValue)* {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), flags, loc: location(), };
      }
      /
      kind:$('FUNCREF'i / 'STRUCT'i) _1 proto:_StdName {
        return { type: 'StructureMemberDeclaration', kind: kind.toLowerCase(), proto, loc: location(), };
      }
    ) _1 declarations:StructMemberDeclr|1.., _Comma| {
        node0.declarations = declarations;
        node0.loc = location();
        return node0;
    }
  ) _0 tComment:EolWWOComment {
    return addTrailingCommentToNode(stmtNode, tComment);
  }

StructMemberDeclr 'structure member declarator' =
  id:(StdId / LiberalId) size:(_0 '[' _0 @$(!_EosLA [^\]])* _0 ']')? {
    return { type: 'StructureMemberDeclarator', id, size: size ? size : undefined, loc: location(), };
  }

// flow control

// - if

IfStmt 'if statement' =
  ifCase:(
    'if'i _0 '(' _0 test:BaseExpr _0 ')' _0 iComment:EolWWOComment
    consequent:InFuncInIfStmt* {
      const node = { type: 'IfCase', test, consequent, loc: location(), };
      if (iComment) {
        node.innerComments = [iComment];
      }
      return node;
    }
  ) otherCases:(
    _0 elseifOrElse:(_IfElseIf / _IfElse)
    consequent:InFuncInIfStmt* {
      const node = { type: 'IfCase', consequent, loc: location(), };
      if (elseifOrElse.label.toLowerCase() === 'elseif') {
        node.test = elseifOrElse.test;
      }
      if (elseifOrElse.comment) {
        node.innerComments = [elseifOrElse.comment];
      }
      return node;
    }
  )*_0 end:(_Eof / &_FuncEnd / _IfEnd) {
    // check the order or "elseif" and "else" cases
    let elseDidAppear = false;
    otherCases.forEach(case0 => {
      if (case0.test) {
        if (elseDidAppear) {
          addProblem('"elseif" appears after "else".', case0.loc, DiagnosticSeverity.Warning);
        }
      } else {
        if (elseDidAppear) {
          addProblem('Duplicated "else".', case0.loc);
        }
        elseDidAppear = true;
      }
    });

    const node = { type: 'IfStatement', cases: [ifCase].concat(otherCases), loc: location(), };
    // Comment at `if (...)` line is added to the first `IfCase`, not to the `IfStatement`.
    return modifyNodeUsingEndPattern(node, end, '"endif"', '"if" block', null);
  }

InFuncInIfStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_IfBlock @InFuncStmtBase / &_IfBlock @BaseEmptyStmt / EmptyEofStmt)
    ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_IfBlock @InFuncStmtBase
  /
  _1 @EmptyEofStmt

_IfBlock =
  _FuncEnd / _IfElseIf / _IfElse / _IfEnd
_IfElseIf =
  label:'elseif'i _0 '(' _0 test:BaseExpr _0 ')' _0 comment:EolWWOComment { return { label, test, comment, loc: location() }; }
_IfElse =
  label:'else'i _0 comment:EolWWOComment { return { label, comment, loc: location() }; }
_IfEnd =
  label:'endif'i _0 comment:EolWWOComment { return { label, comment, loc: location() }; }

// - switch

SwitchStmt 'switch statement' =
  stmtName:$('str'i? 'switch'i) _0 '(' _0 discriminant:BaseExpr _0 ')' _0 iComment:EolWWOComment
  stmtsBeforeCase:InFuncInSwitchStmt*
  cases:(
    _0 case0:_SwitchCase consequent:InFuncInSwitchStmt* {
      const node = { type: 'SwitchCase', test:case0.test, consequent, loc: location(), };
      if (case0.comment) {
        node.innerComments = [case0.comment];
      }
      return node;
    }
    /
    _0 default0:_SwitchDefault consequent:InFuncInSwitchStmt* {
      const node = { type: 'SwitchCase', test: null, consequent, loc: location(), };
      if (default0.comment) {
        node.innerComments = [default0.comment];
      }
      return node;
    }
  )* _0 end:(_Eof / &_FuncEnd / _SwitchEnd) {
    const loc = location();
    // check if statements exist before the first case.
    if (stmtsBeforeCase) {
      stmtsBeforeCase.forEach(stmt => { if (stmt.type !== 'EmptyStatement') { addProblem('Statement not allowed here.', stmt.loc); } });
    }
    // check the order or "case" and "default" cases
    let defaultDidAppear = false;
    if (!cases.some(case0 => !!case0.test)) {
      addProblem('At least one "case" required.', loc, DiagnosticSeverity.Warning);
    }
    cases.forEach(case0 => {
      if (case0.test) {
        if (defaultDidAppear) {
          addProblem('"case" appears after "default".', case0.loc, DiagnosticSeverity.Warning);
        }
      } else {
        if (defaultDidAppear) {
          addProblem('Duplicated "default".', case0.loc, DiagnosticSeverity.Warning);
        }
        defaultDidAppear = true;
      }
    });

    const kind = stmtName.toLowerCase() === 'strswitch' ? 'string' : 'number';
    const node = { type: 'SwitchStatement', discriminant, kind, cases, loc, };
    return modifyNodeUsingEndPattern(node, end, '"endswitch"', '"switch" block', iComment);
  }

InFuncInSwitchStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_SwitchBlock @InFuncStmtBase / &_SwitchBlock @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_SwitchBlock @InFuncStmtBase
  /
  _1 @EmptyEofStmt

_SwitchBlock =
  _FuncEnd / _SwitchCase / _SwitchDefault / _SwitchEnd
_SwitchCase =
  label:'case'i _1 test:(StrLiteral / SignedNumLiteral / StdId) ':' _0 comment:EolWWOComment { return { label, test, comment, loc: location(), }; }
_SwitchDefault =
  label:'default'i _0 ':'_0 comment:EolWWOComment { return { label, comment, loc: location(), }; }
_SwitchEnd =
  label:'endswitch'i _0 comment:EolWWOComment { return { label, comment, loc: location(), }; }

// - try

TryStmt 'try statement' =
  'try'i _0 iComment:EolWWOComment
  block:InFuncInTryStmt*
  _0 catchHeader:_TryCatch
  handler:InFuncInTryStmt*
  _0 end:(_Eof / &_FuncEnd / _TryEnd) {
    const node = { type: 'TryStatement', block, handler, loc: location(), };
    modifyNodeUsingEndPattern(node, end, '"endtry"', '"try" block', iComment);
      // TODO: create `CatchClause` node.
    if (catchHeader.comment) {
      node.innerComments = node.innerComments ?
        [...node.innerComments, catchHeader.comment] :
        catchHeader.comment;
    }
    return node;
  }

InFuncInTryStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_TryBlock @InFuncStmtBase / &_TryBlock @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_TryBlock @InFuncStmtBase
  /
  _1 @EmptyEofStmt

_TryBlock =
  _FuncEnd / _TryCatch / _TryEnd
_TryCatch =
  label:'catch'i _0 comment:EolWWOComment { return { label, comment, loc: location(), }; }
_TryEnd =
  label:'endtry'i _0 comment:EolWWOComment { return { label, comment, loc: location(), }; }

// - do-while

DoWhileStmt 'do-while statement' =
  'do'i _0 iComment:EolWWOComment
  body:InFuncInDoWhileStmt*
  _0 end:(_Eof / &_FuncEnd / _DoWhileEnd) {
    const node = { type: 'DoWhileStatement', body, test: end?.test, loc: location(), };
    return modifyNodeUsingEndPattern(node, end, '"while(...)"', '"do-while" block', iComment);
  }

InFuncInDoWhileStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_DoWhileBlock @InFuncStmtBase / &_DoWhileBlock @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_DoWhileBlock @InFuncStmtBase

  /
  _1 @EmptyEofStmt

_DoWhileBlock =
  _FuncEnd / _DoWhileEnd

_DoWhileEnd =
  label:'while'i _0 '(' _0 test:BaseExpr _0 ')' _0 comment:EolWWOComment { return { label, test, comment, loc: location(), }; }

// - for

ForStmt 'for-loop' =
  // TODO: not strict rule
  'for'i _0 '(' _0 init:AssignUpdateSeqExpr? _0 ';' _0 test:BaseExpr? _0 ';' _0 update:AssignUpdateSeqExpr? _0 ')'_0 iComment:EolWWOComment
  body:InFuncInForStmt*
  _0 end:(_Eof / &_FuncEnd / _ForEnd) {
    const node = { type: 'ForStatement', init, test, update, body, loc: location(), };
    return modifyNodeUsingEndPattern(node, end, '"endfor"', 'for-loop', iComment);
  }

ForInStmt 'range-based for-loop' =
  // TODO: not strict rule
  'for'i _0 '(' _0 left:VariableWWOType? _0 ':' _0 right:BaseExpr _0 ')' _0 iComment:EolWWOComment
  body:InFuncInForStmt*
  _0 end:(_Eof / &_FuncEnd / _ForEnd) {
    const node = { type: 'ForInStatement', left: left, right: right, loc: location(), };
    return modifyNodeUsingEndPattern(node, end, '"endfor"', 'for-loop', iComment);
  }

InFuncInForStmt =
  lComments:(_0 @Comment)+ stmt:(
    _0 @(!_ForBlock @InFuncStmtBase / &_ForBlock @BaseEmptyStmt / EmptyEofStmt)
  ) { return addLeadingCommentsToNode(stmt, lComments); }
  /
  _0 !_ForBlock @InFuncStmtBase
  /
  _1 @EmptyEofStmt

_ForBlock =
  _FuncEnd / _ForEnd
_ForEnd =
  label:'endfor'i _0 comment:EolWWOComment { return { label, comment, loc: location() }; }




AssignUpdateSeqExpr 'comma-separated assignment or update expressions' =
  expressions:(AssignExpr / UpdateExpr)|.., _Comma| {
    return { type: 'SequenceExpression', expressions, loc: location(), };
  }

VariableWWOType 'variable with or without type' =
  // TODO: not strict rule
  kind:$('FUNCREF'i / 'STRUCT'i) _0 proto:_StdName _0 declarator:Declarator {
    return { type: 'VariableDeclaration', kind: kind.toLowerCase(), proto, declarations: [declarator], loc: location(), };
  }
  /
  kind:$('u'i? ('char'i / 'int'i ('16' / '32' / '64')?) / 'float'i / 'double'i) _1 declarator:Declarator {
    return { type: 'VariableDeclaration', kind: kind.toLowerCase(), declarations: [declarator], loc: location(), };
  }
  /
  kind:$('Variable'i / 'String'i / 'Wave'i / 'NVAR'i / 'SVAR'i / 'DFREF'i) flags:(_0 @FlagWOValue)* _1 declarator:Declarator {
    return { type: 'VariableDeclaration', kind: kind.toLowerCase(), flags, declarations: [declarator], loc: location(), };
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
  heads:(VariableWWOType? _CommaWLoc)|..| tail:VariableWWOType? {
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
    return addTrailingCommentToNode(node, tComment);
  }

ContinueStmt 'continue statement' =
  node:(
    'continue'i { return { type: 'ContinueStatement', loc: location(), }; }
  ) _0 tComment:EolWWOComment {
    return addTrailingCommentToNode(node, tComment);
  }

// a command or multiple commands in one line.
OneLineCmndStmt 'statement for a command or multiple commands' =
  node:(
    body:(
      ';' { return { type: 'EmptyStatement', loc: location(), }; }
      /
      @(ReturnStmt / VarDeclStmt / AssignExprStmt / OpStmt / ExprStmt) (_0 ';')?
    )|1.., _0| {
      // return (args.length === 1) ? args[0] : { type: 'BundledStatement', args, loc: location(), };
      if (body.length === 1) {
        if (body[0].type === 'EmptyStatement') { addProblem('Empty statement.', body[0].loc, DiagnosticSeverity.Information); }
        return body[0];
      } else {
        body.forEach(node => {
          if (node.type === 'EmptyStatement') { addProblem('Empty statement.', node.loc, DiagnosticSeverity.Information); }
        });
        return { type: 'BundledStatement', body, loc: location(), };
      }
    }
  ) _0 tComment:EolWWOComment {
    return addTrailingCommentToNode(node, tComment);
  }

// > DisplayHelpTopic "Multiple Return Syntax"
ReturnStmt 'return statement' =
  'return'i args:(_0 @(
    BaseExpr
    /
    '[' _0 elements:BaseExpr|.., _Comma| exComma:_CommaWLoc? _0 ']' {
      if (exComma) { addProblem('Trailing comma not allowed.', exComma); };
      return { type: 'ArrayExpression', elements, kind: 'bracket', loc: location(), };
    } 
  )? _0 &(_Eol / ';' / '//')
) {
    return { type: 'ReturnStatement', argument: args, loc: location(), };
  }

VarDeclStmt 'declaration statement' =
  node0:(
    kind:$('u'i? ('char'i / 'int'i ('16' / '32' / '64')?) / 'float'i / 'double'i) {
      return { type: 'VariableDeclaration', kind: kind.toLowerCase(), loc: location(), };
    }
    /
    kind:$('Variable'i / 'String'i / 'Wave'i / 'NVAR'i / 'SVAR'i / 'DFREF'i) flags:(_0 @Flag)* {
      return { type: 'VariableDeclaration', kind: kind.toLowerCase(), flags, loc: location(), };
    }
    /
    kind:$('FUNCREF'i / 'STRUCT'i) flags:(_0 @Flag)* _1 proto:_StdName {
      return { type: 'VariableDeclaration', kind: kind.toLowerCase(), proto, flags, loc: location(), };
    }
  ) _1 elements:DeclaratorWWOInit|1.., _Comma| exComma:_CommaWLoc? _0 &(_Eol / ';' / '//') {
    if (exComma) { addProblem('Trailing comma not allowed.', exComma); };
    if (/^(?:char|uchar|int(?:16|32)|uint(?:16|32)?)$/.test(node0.kind)) {
      addProblem('This type is available only for structure, not for function.', node0.loc);
    }
    node0.declarations = elements;
    node0.loc = location();
    return node0;
  }

Declarator 'variable delarator' =
  pbr:(@'&' _0)? id:StdId {
    return { type: 'VariableDeclarator', id, init: null, pbr: !!pbr, loc: location(), };
  }

DeclaratorWWOInit 'variable delarator with or without initialization' =
  '&' id:StdId { return { type: 'VariableDeclarator', id, init: null, pbr: true, loc: location(), }; }
  /
  // id:PathExpr init:(_0 '=' _0 @BaseExpr)? {
  id:StdId init:(_0 '=' _0 @BaseExpr)? {
    return { type: 'VariableDeclarator', id, init, pbr: false, loc: location(), };
  }

AssignExprStmt 'expression statement for assignment' =
  // Assignment statement does not exist in the original AST.
  multiThread:('MultiThread'i flags:(_0 @Flag)* _1 { return { flags }; } )? expression:AssignExpr {
    const node = { type: 'ExpressionStatement', expression, loc: location(), };
    if (multiThread) {
      node.multiThread = true;
      node.flags = multiThread.flags;
    }
    return node;
  }

OpStmt 'operation statement' =
  name:_StdName2 &{ return strictOperationRegExp.test(name); } flags:(_0 @Flag)* args:(
    _0 @(
      // BaseExpr (_0 '=' _0 (BaseExpr / BraceListExpr / ParenListExpr / BracketListExpr+))?
      AssignExpr
      /
      BaseExpr
      /
      BraceListExpr
    )
  )|.., _Comma| _0 &(_Eol / ';' / '//') {
    return { type: 'OperationStatement', name, flags, args, loc: location(),};
  }
  /
  name:_StdName2 &{ return operationRegExp.test(name) || options?.operationIdentifiers.includes(name.toLowerCase()); } flags:(_0 @Flag)* args:(
    Flag+ / $_Word+ / StrLiteral / _1 / !(_Eol / ';' / '//') .
  )* {
    // TODO: object properties
    return { type: 'OperationStatement', name, flags, args, loc: location(), };
  }

ExprStmt 'expression statement' =
  expression:(UpdateExpr / CallExpr) _0 &(_Eol / ';' / '//') {
    return { type: 'ExpressionStatement', expression, loc: location(), };
  }

// list of values surrounded with braces ('{}')
BraceListExpr 'list of values' =
  '{' _0 elements:(BraceListExpr / BaseExpr)|1.., _Comma| _0 '}' {
    return { type: 'ArrayExpression', elements, kind: 'brace', loc: location(), };
  }

// list of values surrounded with parentheses ('()')
ParenListExpr 'list of values' =
  '(' _0 elements:(BraceListExpr / BaseExpr)|1.., _Comma| _0 ')' {
    return { type: 'ArrayExpression', elements, kind: 'parenthesis', loc: location(), };
  }

// list of values surrounded with brackets ('[]')
BracketListExpr 'list of values' =
  '[' _0 elements:(BraceListExpr / BaseExpr / '')|.., _Comma| _0 ']' {
    return { type: 'ArrayExpression', elements, kind: 'bracket', loc: location(), };
  }

//
RefExpr 'reference expression' =
  '$' _0 arg:Factor {
    return { type: 'ReferenceExpression', argument: arg, loc: location(), };
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
        return { type: 'BinaryExpression', operator: currentValue[1], left: accumulator, right: currentValue[3], loc: location(), };
      } else {
        return { type: 'ConditionalExpression', test: accumulator, consequent: currentValue[3], alternative: currentValue[7], loc: location(), };
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
      return { type: 'BinaryExpression', operator: currentValue[2], left: currentValue[0], right: accumulator, loc: location(), };
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
      return { type: 'BinaryExpression', operator: currentValue[2], left: currentValue[0], right: accumulator, loc: location(), };
    }, tail);
  }

// addition or string concatenation, and subtraction: '+', '-'
// evaluated from left to right.
Order5 =
  head:Order4 tails:(_0 $('+' / '-') _0 Order4)* {
    return tails.reduce((accumulator, currentValue) => {
      return { type: 'BinaryExpression', operator: currentValue[1], left: accumulator, right: currentValue[3], loc: location(), };
    }, head);
  }

// multiplication and division: '*', '/'
// evaluated from left to right.
Order4 =
  head:Order3 tails:(_0 $('*' / '/') _0 !(_Word+ _0 '=') Order3)* {
    return tails.reduce((accumulator, currentValue) => {
      return { type: 'BinaryExpression', operator: currentValue[1], left: accumulator, right: currentValue[4], loc: location(), };
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
      return { type: 'UnaryExpression', operator: currentValue[0], argument: accumulator, loc: location(), };
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
    _0 operator:('^' / '<<' / '>>') _0 right:Order1 {
      return { operator, right, };
    }
    /
    _0 operator:'^' _0 uos2:(@$('!' / '~' / '-' ! '-'/ '+' ! '+' / '%~') _0)+ right2:Order1 {
      const right = uos2.reduceRight((accumulator, currentValue) => {
        if (currentValue[0] === '%~') {
          const loc = location();
          addProblem('Obsolete bit-wise unary operator.', getRange(loc.source, loc.start, 2, 0), DiagnosticSeverity.Information);
        }
        return { type: 'UnaryExpression', operator: currentValue, arg: accumulator,   loc: location(), };
      }, right2);
      return { operator, right, };
    }
  )* {
    return tails.reduce((accumulator, currentValue) => {
      return { type: 'BinaryExpression', operator: currentValue.operator, left: accumulator, right: currentValue.right, loc: location(), };
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
  / NumLiteral / StrLiteral / CallExpr / Variable

_AssignOp = $('=' !'=' / '+=' / '-=' / '*=' / '/=' / ':=')

AssignExpr 'assignment expression' =
  left:LValue _0 operator:_AssignOp _0 right:(BraceListExpr / BaseExpr) {
    return { type: 'AssignmentExpression', operator, left, right, multiThread: false, loc: location(), };
  }

UpdateExpr =
  operator:('++' / '--') _0 argument:(StdId / LiberalId) {
    return { type: 'UpdateExpression', operator, argument, prefix: true, loc: location(), };
  }
  /
  argument:(StdId / LiberalId) _0 operator:('++' / '--') {
    return { type: 'UpdateExpression', operator, argument, prefix: false, loc: location(), };
  }

CallExpr 'function call' =
  callees:(@(StdId / LiberalId) _0)|1.., '#' _0| '(' _0 args:_FuncParam|.., _Comma| _0')' !(_0 ('[' / '(')) {
    if (callees.length > 3) {
      addProblem('Too many "#"s.', location());
    }
    return { type: 'CallExpression', callee:callees[callees.length - 1], modules: callees.slice(0, -1), arguments: args, loc: location(), };
  }

_FuncParam 'function parameter' =
  left:StdId _0 '=' _0 right:BaseExpr {
    return { type: 'AssignmentExpression', operator: '=', left, right, loc: location(), };
  }
  /
  BaseExpr

Variable =
  object:(
    heads:(@ArrayElement _0 '.' _0)+ tail:ArrayElement _0 {
      return heads.reduce((accumulator, currentValue) => {
        return { type: 'MemberExpression', object: accumulator, property: currentValue, loc: location(),  };
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
      return { type: 'ArrayElementExpression', object, indexes, loc: location(), };
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
      return { type: 'ArrayElement', object, index, loc: location(), };
    } else {
      return object;
    }
  }

PathExpr 'path expression' =
  heads:(@(RefExpr / StdId / LiberalId)? ':')+ tail:(RefExpr / StdId / LiberalId)? {
    return { type: 'PathExpression', body: [...heads, tail], loc: location(), };
  }
  /
  RefExpr / StdId / LiberalId

// Using a reference expression such as `$destw` as the left value is allowed in macros but is not in functions. 
LValue =
  RefExpr
  /
  Variable
  /
  '[' _0 elements:VariableWWOType|.., _Comma| _0 ']' {
    return { type: 'ArrayExpression', elements, kind: 'bracket', loc: location(), };
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
      return { type: 'WaveRange', start, end: extra.end, increment: extra.inc, loc: location(), };
    } else {
    return { type: 'WaveIndex', index: start, loc: location(), };
    }
  }
  /
  end:ArrayElemEnd increment:ArrayElemInc? {
    checkWaveElemInc(increment);
    return { type: 'WaveRange', start: null, end, increment, loc: location(), };
  }
  /
  increment:ArrayElemInc {
    checkWaveElemInc(increment);
    return { type: 'WaveRange', start: null, end: null, increment, loc: location(), };
  }

LabelOrIndex = 
  '*' { return { type: 'Literal', value: Infinity, raw: '*', loc: location(), }; }
  /
  labelMarker:(@'%' _0)? labelOrIndex:BaseExpr {
    if (labelMarker) {
      return { type: 'WaveDimLabel', label: labelOrIndex, loc: location(), };
    } else {
      return labelOrIndex;
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

_StdName 'standard name' =
  [a-zA-Z][a-zA-Z0-9_]* { return text(); }

_StdName2 'standard name' =
  [a-zA-Z][a-zA-Z0-9]* { return text(); }

StdId 'standard identifier' =
  name:_StdName {
    return { type: 'Identifier', name, kind: 'strict', loc: location(), };
  }

_LiberalName 'liberal name' =
  // "'" @$[^'";:]* "'"
  "'" str:$[^'";:]* "'" { return str; }

LiberalId 'liberal identifier' =
  name:_LiberalName {
    return { type: 'Identifier', name, kind: 'liberal', loc: location(), };
  }

NumLiteral 'numeric literal' =
  // floating-point
  (([0-9]+ (_Exponent / '.' [0-9]* _Exponent?)) / '.' [0-9]+ _Exponent?) {
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
  'NaN'i !_Word {
    return { type: 'Literal', value: NaN, raw: text(), loc: location(), };
  }
  /
  // Infinity
  'Inf'i !_Word {
    return { type: 'Literal', value: Infinity, raw: text(), loc: location(), };
  }

SignedNumLiteral =
  operator:('+' /  '-')? _0 arg:NumLiteral {
    return operator ? { type: 'UnaryExpression', operator, argument: arg, loc: location(), } : arg;
  }

_SignedNumLiteralRaw =
  operator:('+' /  '-')? _0 arg:NumLiteral {
    return Number(text());
  }

// exponential part in floating-point digit, e.g., E+3 in 1.2E+3)
_Exponent = [eE] [+-]? [0-9]+

// word, mainly used for look-ahead.
_Word = [a-zA-Z0-9_]

_StrRaw 'string' =
  // '"' @$('\\' . / [^"])* '"'
  '"' str:$('\\' . / [^"])* '"' { return str; }

StrLiteral 'string literal' =
  str:_StrRaw {
    return { type: 'Literal', value: str, raw: text(), loc: location(), };
  }
  /
  'U+' body:$([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) {
    return { type: 'Literal', value: String.fromCodePoint(parseInt(body, 16)), raw: text(), loc: location(), };  }

StrId 'string identifier' =
  name:_StrRaw {
    return { type: 'Identifier', name, kind: 'string', loc: location(), };
  }

FlagWOValue =
  '/' _0 key:_StdName2 {
    return { type: 'Flag', key, loc: location(), };
  }

Flag 'operation flag' =
  // '/' _0 key:_StdName2 value:(_0 '=' _0 @(BraceListExpr / ParenListExpr / BracketListExpr+ / SignedNumericLiteral / StringLiteral / CallExpr / RefExpr / Variable))? {
  '/' _0 key:_StdName2 value:(_0 '=' _0 @(BraceListExpr / ParenListExpr / BracketListExpr+ / BaseExpr))? {
    return { type: 'Flag', key, value, loc: location(), };
  }
