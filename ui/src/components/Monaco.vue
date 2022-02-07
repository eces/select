<template>
<div class="monaco-editor-container" :style='style'></div>
</template>
<script>
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// import { language as language_yaml} from 'monaco-editor/esm/vs/basic-languages/yaml/yaml';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
// import * as l from 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';

function noop() { }

export { monaco };

// const Monokai = require('./monokai.json')
const Chrome = require('./Chrome.json')

export default {
  name: 'MonacoEditor',
  props: {
    diffEditor: { type: Boolean, default: false },
    width: {type: [String, Number], default: '100%'},
    height: {type: [String, Number], default: '100%'},
    autoheight: String,
    original: String,
    value: String,
    language: {type: String, default: 'javascript'},
    theme: {type: String, default: 'vs'},
    options: {type: Object, default() {return {};}},
    editorMounted: {type: Function, default: noop},
    editorBeforeMount: {type: Function, default: noop},
  },

  watch: {
    options: {
      deep: true,
      handler(options) {
        this.editor && this.editor.updateOptions(options);
      }
    },

    value() {
      this.editor && this.value !== this._getValue() && this._setValue(this.value);
    },

    language() {
      if(!this.editor) return;
      if(this.diffEditor){
        const { original, modified } = this.editor.getModel();
        monaco.editor.setModelLanguage(original, this.language);
        monaco.editor.setModelLanguage(modified, this.language);
      }else
        monaco.editor.setModelLanguage(this.editor.getModel(), this.language);
    },

    theme() {
      this.editor && monaco.editor.setTheme(this.theme);
    },

    style() {
      this.editor && this.$nextTick(() => {
        this.editor.layout();
      });
    }
  },

  computed: {
    style() {
      return {
        width: !/^\d+$/.test(this.width) ? this.width : `${this.width}px`,
        height: !/^\d+$/.test(this.height) ? this.height : `${this.height}px`
      }
    }
  },

  mounted () {
    this.initMonaco();
  },

  beforeDestroy() {
    this.editor && this.editor.dispose();
  },
  
  methods: {
    initMonaco() {
      const { value, language, theme, options } = this;
      Object.assign(options, this._editorBeforeMount());

      console.log('>>>>>>>>>>', monaco.languages.getLanguages())

      // monaco.editor.defineTheme('monokai', Monokai)
      // monaco.languages.register({id: 'yaml'})
      monaco.editor.defineTheme('chrome', Chrome)
      let autoheight_options = {}
      if (this.autoheight) {
        autoheight_options = {
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingStrategy: 'advanced',
          minimap: {
              enabled: false
          },
          overviewRulerLanes: 0,
        }
      }
      this.editor = monaco.editor[this.diffEditor ? 'createDiffEditor' : 'create'](this.$el, {
        value: value,
        language: language,
        theme: theme,
        ...options,
        ...autoheight_options,
        wordWrap: 'on',
        // wrappingStrategy: 'advanced',
        scrollbar: {
          alwaysConsumeMouseWheel: false,
        },
        minimap: {
          enabled: false,
        },
      });
      this.diffEditor && this._setModel(this.value, this.original);

      this.editor.addAction({
        id: "executeCurrent",
        label: "Execute Block",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        contextMenuGroupId: "2_execution",
        precondition: "editorTextFocus && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible",
        run: () => {
          this.$emit('didCmdEnter')
        },
      });
      this.editor.addAction({
        id: "executeCurrent2",
        label: "Execute Block",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
        contextMenuGroupId: "2_execution",
        precondition: "editorTextFocus && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible",
        run: () => {
          this.$emit('didCmdR')
        },
      });
      this.editor.addAction({
        id: "saveCurrent",
        label: "Save Block",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        contextMenuGroupId: "2_execution",
        precondition: "editorTextFocus && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible",
        run: () => {
          this.$emit('didCmdS')
        },
      });
      this.editor.addAction({
        id: "openCurrent",
        label: "Open YAML",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY],
        contextMenuGroupId: "2_execution",
        precondition: "editorTextFocus && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible",
        run: () => {
          this.$emit('didCmdY')
        },
      });

      if (this.autoheight) {
        let ignoreEvent = false;
        const updateHeight = () => {
          const width = this.$el.offsetWidth
          const contentHeight = Math.min(1000, this.editor.getContentHeight());
          // this.$el.style.width = `${width}px`;
          this.$el.style.width = `${width}`;
          this.$el.style.height = `${contentHeight}px`;
          try {
            ignoreEvent = true;
            this.editor.layout({ width, height: contentHeight });
          } finally {
            ignoreEvent = false;
          }
        };
        this.editor.onDidContentSizeChange(updateHeight);
        updateHeight();
      }
      this._editorMounted(this.editor);
    },

    _getEditor() {
      if(!this.editor) return null;
      return this.diffEditor ? this.editor.modifiedEditor : this.editor;
    },

    _setModel(value, original) {
      const { language } = this;
      const originalModel = monaco.editor.createModel(original, language);
      const modifiedModel = monaco.editor.createModel(value, language);
      this.editor.setModel({
        original: originalModel,
        modified: modifiedModel
      });
    },

    _setValue(value) {
      let editor = this._getEditor();
      if(editor) return editor.setValue(value);
    },

    _getValue() {
      let editor = this._getEditor();
      if(!editor) return '';
      return editor.getValue();
    },

    _editorBeforeMount() {
      const options = this.editorBeforeMount(monaco);
      return options || {};
    },

    _editorMounted(editor) {
      this.editorMounted(editor, monaco);
      if(this.diffEditor){
        editor.onDidUpdateDiff((event) => {
          const value = this._getValue();
          this._emitChange(value, event);
        });
      }else{
        editor.onDidChangeModelContent(event => {
          const value = this._getValue();
          this._emitChange(value, event);
        });
        editor.onDidFocusEditorWidget(event => {
          this.$emit('focus')
        });
        editor.onDidBlurEditorWidget(event => {
          this.$emit('blur')
        });
      }
    },

    _emitChange(value, event) {
      this.$emit('change', value, event);
      this.$emit('input', value);
    }
  }
}
</script>