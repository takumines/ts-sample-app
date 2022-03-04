// Project State Management
class ProjectState {
  private listeners: any[] = [];
  private projects: any[] = [];
  private static instance: ProjectState;

  private constructor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();

    return this.instance;
  }

  // イベントを追加する
  addListener(listenerFn: Function) {
    this.listeners.push(listenerFn);
  }

  // projectを一覧に追加する
  addProject(
    title: string,
    description: string,
    manday: number
  ) {
    const newProject = {
      id: Math.random().toString(),
      title: title,
      description: description,
      manday: manday,
    }

    this.projects.push(newProject);
    // イベントを全て実行する
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

// シングルトンインスタンス
const projectState = ProjectState.getInstance();

//validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

// projectのバリデーションを行う関数
function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

// auto-bind decorator
function autobind(
  _: any,
  _2: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const bounFn = originalMethod.bind(this);
      return bounFn;
    }
  }
  return adjDescriptor;
}

// ProjectList Class
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: any[];

  constructor(private type: 'active' | 'finished') {
    this.templateElement = document.getElementById(
      'project-list'
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(
      'app'
    )! as HTMLDivElement;
    // project一覧の初期化
    this.assignedProjects = [];

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`

    // フォームに入力された案件を一覧に表示する処理
    projectState.addListener((projects: any[]) => {
      this.assignedProjects = projects;
      this.renderProjects();
    });

    this.attach();
    this.renderContent();
  }

  // 一覧に案件を表示
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    for (const prjItem of this.assignedProjects) {
      console.log(prjItem);
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }

  // 一覧要素を表示
  private renderContent()
  {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type === 'active' ?
      '実行中プロジェクト' : '完了プロジェクト';
  }

  private attach() {
    // id: appをもつdivタグにコンテンツをマウントする
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }
}

// ProjectInput Class
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  mandayInputElement: HTMLInputElement;

  constructor() {
    // id: project-inputのtemplateタグのDOM情報を取得
    this.templateElement = document.getElementById(
      'project-input'
    )! as HTMLTemplateElement;
    // id: appのdivタグのDOM情報を取得
    this.hostElement = document.getElementById(
      'app'
    )! as HTMLDivElement;

    // templateElementプロパティに格納されたDOMのコンテンツをインポートしてくる
    const importedNode = document.importNode(this.templateElement.content, true);

    this.element = importedNode.firstElementChild as HTMLFormElement;
    // idを追加している
    this.element.id = 'user-input';

    // フォームの入力情報の取得処理
    this.titleInputElement = this.element.querySelector(
      '#title'
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement;
    this.mandayInputElement = this.element.querySelector(
      '#manday'
    ) as HTMLInputElement;

    this.configure();
    this.attach();
  }

  // フォームの値を初期化する
  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.mandayInputElement.value = '';
  }

  // フォームの入力チェックと入力値を取得する
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredManday = this.mandayInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    }
    const descValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    }
    const mandayValidatable: Validatable = {
      value: +enteredManday,
      required: true,
      min: 1,
      max: 1000
    }
    if (
      !validate(titleValidatable) ||
      !validate(descValidatable) ||
      !validate(mandayValidatable)
    ) {
      alert('入力値が正しくありません。再度お試しください。');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredManday];
    }
  }

  @autobind
  private submitHandler(event: Event) {
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
  private configure() {
    // bindメソッドで参照するオブジェクトを指定している
    this.element.addEventListener('submit', this.submitHandler)
  }

  private attach() {
    // id: appをもつdivタグにコンテンツをマウントする
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }
}

const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();