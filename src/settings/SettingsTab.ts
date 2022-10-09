import {App, PluginSettingTab, Setting} from "obsidian";
import ExecuteCodePlugin, {canonicalLanguages, LanguageId} from "src/main";
import makeCppSettings from "./per-lang/makeCppSettings";
import makeCsSettings from "./per-lang/makeCsSettings";
import makeGoSettings from "./per-lang/makeGoSettings";
import makeGroovySettings from "./per-lang/makeGroovySettings";
import makeHaskellSettings from "./per-lang/makeHaskellSettings";
import makeJavaSettings from "./per-lang/makeJavaSettings";
import makeJsSettings from "./per-lang/makeJsSettings";
import makeKotlinSettings from "./per-lang/makeKotlinSettings";
import makeLuaSettings from "./per-lang/makeLuaSettings";
import makeMathematicaSettings from "./per-lang/makeMathematicaSettings";
import makePowershellSettings from "./per-lang/makePowershellSettings";
import makePrologSettings from "./per-lang/makePrologSettings";
import makePythonSettings from "./per-lang/makePythonSettings";
import makeRSettings from "./per-lang/makeRSettings";
import makeRustSettings from "./per-lang/makeRustSettings";
import makeShellSettings from "./per-lang/makeShellSettings";
import makeTsSettings from "./per-lang/makeTsSettings";
import {ExecutorSettings} from "./Settings";


/**
 * This class is responsible for creating a settings tab in the settings menu. The settings tab is showed in the
 * regular obsidian settings menu.
 *
 * The {@link display} functions build the html page that is showed in the settings.
 */
export class SettingsTab extends PluginSettingTab {
	plugin: ExecuteCodePlugin;

	languageContainers: Partial<Record<LanguageId, HTMLDivElement>>;
	activeLanguageContainer: HTMLDivElement | undefined;

	constructor(app: App, plugin: ExecuteCodePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		
		this.languageContainers = {}
	}

	/**
	 *  Builds the html page that is showed in the settings.
	 */
	display() {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for the Code Execution Plugin.'});


		// ========== General ==========
		containerEl.createEl('h3', {text: 'General Settings'});
		new Setting(containerEl)
			.setName('Timeout (in seconds)')
			.setDesc('The time after which a program gets shut down automatically. This is to prevent infinite loops. ')
			.addText(text => text
				.setValue("" + this.plugin.settings.timeout / 1000)
				.onChange(async (value) => {
					if (Number(value) * 1000) {
						console.log('Timeout set to: ' + value);
						this.plugin.settings.timeout = Number(value) * 1000;
					}
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Allow Input')
			.setDesc('Whether or not to include a stdin input box when running blocks. In order to apply changes to this, Obsidian must be refreshed. ')
			.addToggle(text => text
				.setValue(this.plugin.settings.allowInput)
				.onChange(async (value) => {
					console.log('Allow Input set to: ' + value);
					this.plugin.settings.allowInput = value
					await this.plugin.saveSettings();
				}));

		// TODO setting per language that requires main function if main function should be implicitly made or not, if not, non-main blocks will not have a run button

		containerEl.createEl("hr");
		
		new Setting(containerEl)
		.setName("Language-Specific Settings")
		.setDesc("Pick a language to edit its language-specific settings")
		.addDropdown((dropdown) => dropdown
			.addOptions(Object.fromEntries(
				canonicalLanguages.map(x=>[x, x])
			))
			.onChange(value=> {
				this.focusContainer(value as LanguageId)
			})
		)
		.settingEl.style.borderTop = "0";
		

		// ========== JavaScript / Node ==========
		makeJsSettings(this, this.makeContainerFor("js"));

		// ========== TypeScript ==========
		makeTsSettings(this, this.makeContainerFor("ts"));

		// ========== Lua ==========
		makeLuaSettings(this, this.makeContainerFor("lua"));

		// ========== CSharp ==========
		makeCsSettings(this, this.makeContainerFor("cs"));

		// ========== Java ==========
		makeJavaSettings(this, this.makeContainerFor("java"));


		// ========== Python ==========
		makePythonSettings(this, this.makeContainerFor("python"));


		// ========== Golang =========
		makeGoSettings(this, this.makeContainerFor("go"));


		// ========== Rust ===========
		makeRustSettings(this, this.makeContainerFor("rust"));


		// ========== C++ ===========
		makeCppSettings(this, this.makeContainerFor("cpp"));


		// ========== Shell ==========
		makeShellSettings(this, this.makeContainerFor("shell"));


		// ========== Powershell ==========
		makePowershellSettings(this, this.makeContainerFor("powershell"));


		// ========== Prolog ==========
		makePrologSettings(this, this.makeContainerFor("prolog"));


		// ========== Groovy ==========
		makeGroovySettings(this, this.makeContainerFor("groovy"));


		// ========== R ==========
		makeRSettings(this, this.makeContainerFor("r"));


		// ========== Kotlin ==========
		makeKotlinSettings(this, this.makeContainerFor("kotlin"));

		// ========== Mathematica ==========
		makeMathematicaSettings(this, this.makeContainerFor("mathematica"));


		// ========== Haskell ===========
		makeHaskellSettings(this, this.makeContainerFor("haskell"));

		this.focusContainer(canonicalLanguages[0]);
	}
	
	private makeContainerFor(language: LanguageId) {
		const container = this.containerEl.createDiv();
		
		container.style.display = "none";
		
		this.languageContainers[language] = container;
		
		return container;
	}
	
	private focusContainer(language: LanguageId) {
		if(this.activeLanguageContainer) 
			this.activeLanguageContainer.style.display = "none";
			
		if(language in this.languageContainers) {
			this.activeLanguageContainer = this.languageContainers[language];
			this.activeLanguageContainer.style.display = "block";
		}
	}

	sanitizePath(path: string): string {
		path = path.replace(/\\/g, '/');
		path = path.replace(/['"`]/, '');
		path = path.trim();

		return path
	}

	makeInjectSetting(containerEl: HTMLElement, language: LanguageId, languageAlt: string) {
		new Setting(containerEl)
			.setName(`Inject ${languageAlt} code`)
			.setDesc(`Code to add to the top of every ${languageAlt} code block before running.`)
			.setClass('settings-code-input-box')
			.addTextArea(textarea => {
				// @ts-ignore
				const val = this.plugin.settings[`${language}Inject` as keyof ExecutorSettings as string]
				return textarea
					.setValue(val)
					.onChange(async (value) => {
						(this.plugin.settings[`${language}Inject` as keyof ExecutorSettings] as string) = value;
						console.log(`${language} inject set to ${value}`);
						await this.plugin.saveSettings();
					});
			});
	}
}
