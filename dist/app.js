"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// Project State Management
class ProjectState {
    constructor() {
        this.listeners = [];
        this.projects = [];
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }
    // イベントを追加する
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
    // projectを一覧に追加する
    addProject(title, description, manday) {
        const newProject = {
            id: Math.random().toString(),
            title: title,
            description: description,
            manday: manday,
        };
        this.projects.push(newProject);
        // イベントを全て実行する
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}
// シングルトンインスタンス
const projectState = ProjectState.getInstance();
// projectのバリデーションを行う関数
function validate(validatableInput) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (validatableInput.minLength != null &&
        typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null &&
        typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null &&
        typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null &&
        typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}
// auto-bind decorator
function autobind(_, _2, descriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor = {
        configurable: true,
        get() {
            const bounFn = originalMethod.bind(this);
            return bounFn;
        }
    };
    return adjDescriptor;
}
// ProjectList Class
class ProjectList {
    constructor(type) {
        this.type = type;
        this.templateElement = document.getElementById('project-list');
        this.hostElement = document.getElementById('app');
        // project一覧の初期化
        this.assignedProjects = [];
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        this.element.id = `${this.type}-projects`;
        // フォームに入力された案件を一覧に表示する処理
        projectState.addListener((projects) => {
            this.assignedProjects = projects;
            this.renderProjects();
        });
        this.attach();
        this.renderContent();
    }
    // 一覧に案件を表示
    renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`);
        for (const prjItem of this.assignedProjects) {
            console.log(prjItem);
            const listItem = document.createElement('li');
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem);
        }
    }
    // 一覧要素を表示
    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul').id = listId;
        this.element.querySelector('h2').textContent = this.type === 'active' ?
            '実行中プロジェクト' : '完了プロジェクト';
    }
    attach() {
        // id: appをもつdivタグにコンテンツをマウントする
        this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
}
// ProjectInput Class
class ProjectInput {
    constructor() {
        // id: project-inputのtemplateタグのDOM情報を取得
        this.templateElement = document.getElementById('project-input');
        // id: appのdivタグのDOM情報を取得
        this.hostElement = document.getElementById('app');
        // templateElementプロパティに格納されたDOMのコンテンツをインポートしてくる
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        // idを追加している
        this.element.id = 'user-input';
        // フォームの入力情報の取得処理
        this.titleInputElement = this.element.querySelector('#title');
        this.descriptionInputElement = this.element.querySelector('#description');
        this.mandayInputElement = this.element.querySelector('#manday');
        this.configure();
        this.attach();
    }
    // フォームの値を初期化する
    clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.mandayInputElement.value = '';
    }
    // フォームの入力チェックと入力値を取得する
    gatherUserInput() {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredManday = this.mandayInputElement.value;
        const titleValidatable = {
            value: enteredTitle,
            required: true,
        };
        const descValidatable = {
            value: enteredDescription,
            required: true,
            minLength: 5,
        };
        const mandayValidatable = {
            value: +enteredManday,
            required: true,
            min: 1,
            max: 1000
        };
        if (!validate(titleValidatable) ||
            !validate(descValidatable) ||
            !validate(mandayValidatable)) {
            alert('入力値が正しくありません。再度お試しください。');
            return;
        }
        else {
            return [enteredTitle, enteredDescription, +enteredManday];
        }
    }
    submitHandler(event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, manday] = userInput;
            // projectを追加する処理
            projectState.addProject(title, desc, manday);
            this.clearInputs();
        }
    }
    // イベントリスナーの設定
    configure() {
        // bindメソッドで参照するオブジェクトを指定している
        this.element.addEventListener('submit', this.submitHandler);
    }
    attach() {
        // id: appをもつdivタグにコンテンツをマウントする
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }
}
__decorate([
    autobind
], ProjectInput.prototype, "submitHandler", null);
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
