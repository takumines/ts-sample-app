enum ProjectStatus {
  Active, Finished
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public manday:number,
    public status:ProjectStatus
  ) {}
}

// Project State Management
type Listener<T> = (items: Project[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  // イベントを追加する
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project>{
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();

    return this.instance;
  }

  // projectを一覧に追加する
  addProject(
    title: string,
    description: string,
    manday: number
  ) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      manday,
      ProjectStatus.Active
    )

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

// Component Class

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string,
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(
      hostElementId
    )! as T;
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId
    }

    this.attach(insertAtStart);
  }

  abstract configure(): void
  abstract renderContent(): void;

  private attach(insertAtBeginning: boolean) {
    // id: appをもつdivタグにコンテンツをマウントする
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? 'afterbegin' : 'beforeend',
      this.element
    );
  }
}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement>{
  assignedProjects: Project[];

  constructor(private type: 'active' | 'finished') {
    super(
      'project-list',
      'app',
      false,
      `${type}-projects`
    );

    // project一覧の初期化
    this.assignedProjects = [];
    this.configure();
    this.renderContent();
  }

  configure() {
    // フォームに入力された案件を一覧に表示する処理
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(prj => {
        if (this.type === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return  prj.status === ProjectStatus.Finished
      })
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  // 一覧要素を表示
  public renderContent()
  {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type === 'active' ?
      '実行中プロジェクト' : '完了プロジェクト';
  }

  // 一覧に案件を表示
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    // 一旦一覧に表示している案件を削除する。
    listEl.innerHTML = '';
    for (const prjItem of this.assignedProjects) {
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }
}

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement>{
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  mandayInputElement: HTMLInputElement;

  constructor() {
    super(
      'project-input',
      'app',
      true,
      'user-input'
    );

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
  }
  renderContent() {}

  // イベントリスナーの設定
  public configure() {
    // bindメソッドで参照するオブジェクトを指定している
    this.element.addEventListener('submit', this.submitHandler)
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
}

const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();