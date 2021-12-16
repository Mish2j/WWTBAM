import {
  SAME_CATEGORY_API_URL,
  HELP_OPTION_AUDIENCE,
  HELP_OPTION_CALL,
  HELP_OPTION_FIFTY,
  LEVEL_DIFFICULTY,
  NEXT_LVL_DIFFICULTY,
  MAX_QUESTIONS,
  DIFFICULTY_LVL_API_URL,
} from "./config";
import {
  randomValFromR,
  randomUniqueMultipleElFromArr,
  getJson,
  shuffleArray,
  removeHTMLTags,
  getArrayRandomInts,
  getRandomNum,
} from "./helpers";

let thisGame = {};
class Game {
  static async startTheGame() {
    UI.toggleGameUi();
    thisGame = new GameLogic();
    const question = await thisGame.generateQuestion();
    UI.displayQuestion(question);
  }
  static endTheGame() {
    UI.toggleGameUi();
    UI.initUI();
    thisGame = {};
  }
}

class UI {
  static play_btn = document.querySelector(".startingPos__btn");
  static game_container = document.querySelector(".game");
  static starting_position = document.querySelector(".startingPos");
  static answers_text_el = document.querySelectorAll(".answer__text");
  static question_container = document.querySelector(".question__text");
  static help_btn_container = document.querySelector(".help__container");
  static answers_btn_container = document.querySelector(".answer__container");
  static sidebar_btn = document.querySelector(".sidebar__btn");
  static prize_list = document.querySelectorAll(".prize__li");
  static overlay = document.querySelector(".overlay");
  static modal = document.querySelector(".modal");
  static modal_close_btn = document.querySelector(".modal__close");
  static modal_text_container = document.querySelector(".modal__text");
  static loader = document.querySelector(".loader");

  static initUI() {
    this.prize_list.forEach((el) => {
      if (!el.classList.contains("prize__current")) return;
      el.classList.remove("prize__current");
    });

    const allHelpBnt = this.help_btn_container.querySelectorAll("button");
    const allAnswersBtn = this.answers_btn_container.querySelectorAll("button");

    [...allHelpBnt, ...allAnswersBtn].forEach((btn) => {
      if (btn.classList.contains("btn--disabled") || btn.disabled) {
        this.activateBtn(btn);
      }
    });

    [this.question_container, ...this.answers_text_el].forEach(
      (el) => (el.innerText = "")
    );

    if (this.sidebar_btn.closest("aside").classList.contains("slide")) {
      this.toggleSidebar();
    }
  }

  static toggleLoader() {
    this.loader.classList.toggle("hidden");
  }

  static toggleSidebar() {
    const btn = this.sidebar_btn;
    const sidebar = btn.closest("aside");

    btn.children[0].classList.toggle("rotate");
    sidebar.classList.toggle("slide");
  }

  static closeModal() {
    this.modal.classList.add("hidden");
    this.overlay.classList.add("hidden");
    this.modal_text_container.innerHTML = "";
  }

  static openModal(messages = []) {
    messages.forEach((msg) => {
      const msgEl = document.createElement("p");
      const msgText = document.createTextNode(removeHTMLTags(msg));
      msgEl.appendChild(msgText);
      this.modal_text_container.insertAdjacentElement("beforeend", msgEl);
    });

    this.modal.classList.remove("hidden");
    this.overlay.classList.remove("hidden");
  }

  static selectPrize() {
    const currentIndex = MAX_QUESTIONS - thisGame.currentQuestion;
    const prevIndex = currentIndex + 1;
    if (this.prize_list[prevIndex]) {
      this.prize_list[prevIndex].classList.remove("prize__current");
    }
    this.prize_list[currentIndex].classList.add("prize__current");
  }

  static disableBtn(btn) {
    btn.disabled = true;
    btn.classList.add("btn--disabled");
  }

  static activateBtn(btn) {
    btn.disabled = false;
    btn.classList.remove("btn--disabled");
  }

  static toggleGameUi() {
    this.starting_position.classList.toggle("hidden");
    this.game_container.classList.toggle("hidden");
    this.sidebar_btn.closest("aside").classList.toggle("hidden");
  }

  static displayQuestion(question) {
    this.question_container.innerText = question;

    const allAnswers = shuffleArray(thisGame.getAllAnswers());

    this.answers_text_el.forEach((cont, i) => {
      cont.innerText = removeHTMLTags(allAnswers[i]);
    });
  }

  static hideTwoWrongAnswers(wrongAnswers) {
    this.answers_text_el.forEach((text) => {
      if (wrongAnswers.includes(text.innerText)) {
        this.disableBtn(text.parentElement);
      }
    });
  }

  static displayAudienceHelp(answers) {
    const [correct, ...rest] = answers;

    const allAnswers = thisGame.getAllAnswers();

    const filterWrongs = allAnswers.filter(
      (el) => el !== thisGame.currentQuestionCorrectAnswer
    );

    const audienceAnswerForCorrect = `${correct}% of audience voted for '${thisGame.currentQuestionCorrectAnswer}'`;

    const restOfAudience = rest.map((ansPercent, i) => {
      return `${ansPercent}% of audience voted for '${filterWrongs[i]}'`;
    });

    const shuffledAudienceAnswersArray = shuffleArray([
      audienceAnswerForCorrect,
      ...restOfAudience,
    ]);

    this.openModal(shuffledAudienceAnswersArray);
  }
}

class GameLogic {
  currentQuestionCorrectAnswer = "";
  allRandomWrongAnswers = [];
  NUM_OF_WRONG_ANSWERS = 3;
  difficulty = LEVEL_DIFFICULTY.VERY_EASY;
  currentQuestion = 0;
  isHelpCallUsed = false;
  isHelpAudienceUsed = false;
  isHelpFiftyUsed = false;
  questionsAskedId = [];

  getRandomUnqiueWrongAnswers(arr, uniqueArr, loops, correctAnswer) {
    const randomEl = randomValFromR(arr);
    while (uniqueArr.length !== loops) {
      if (!uniqueArr.includes(randomEl) && randomEl.answer !== correctAnswer) {
        uniqueArr.push(randomEl);
      } else {
        this.getRandomUnqiueWrongAnswers(arr, uniqueArr, loops, correctAnswer);
      }
    }
  }

  async getSameCategoryRandomAnswers(categoryId, correctAnswer) {
    try {
      let uniqueRandomWrongAnswers = [];

      const sameCategoryQuestions = await getJson(
        `${SAME_CATEGORY_API_URL}${categoryId}`
      );

      if (sameCategoryQuestions.length === 0)
        throw new Error(`Failed to upload answers!`);

      this.getRandomUnqiueWrongAnswers(
        sameCategoryQuestions,
        uniqueRandomWrongAnswers,
        this.NUM_OF_WRONG_ANSWERS,
        correctAnswer
      );

      const randomWrongAnswers = uniqueRandomWrongAnswers.map((q) => q.answer);

      return randomWrongAnswers;
    } catch (error) {
      throw error;
    }
  }

  async getNewQuestion() {
    try {
      const questions = await getJson(
        `${DIFFICULTY_LVL_API_URL}${this.difficulty}`
      );

      if (questions.length === 0)
        throw new Error(`Failed to upload new question!`);

      const currentQuestionData = randomValFromR(questions);

      const {
        id,
        category_id: curQuestionCategoryId,
        question,
        answer,
      } = currentQuestionData;

      if (this.questionsAskedId.includes(id)) return this.getNewQuestion();
      this.questionsAskedId.push(id);

      const randomWrongAnswers = await this.getSameCategoryRandomAnswers(
        curQuestionCategoryId,
        answer
      );

      const sanitizeAnswer = removeHTMLTags(answer);
      const sanitizeWrongAnswers = randomWrongAnswers.map((ans) =>
        removeHTMLTags(ans)
      );

      this.currentQuestionCorrectAnswer = sanitizeAnswer;
      this.allRandomWrongAnswers = sanitizeWrongAnswers;

      return question;
    } catch (error) {
      throw error;
    }
  }

  async generateQuestion() {
    UI.toggleLoader();

    try {
      this.currentQuestion++;

      this.difficulty = this.setNewDifficulty(
        MAX_QUESTIONS,
        this.currentQuestion,
        this.difficulty
      );

      const question = await this.getNewQuestion();

      return question;
    } catch (error) {
      UI.openModal([`Something went wrong!`, error.message]);
    } finally {
      UI.toggleLoader();
    }
  }

  async checkAnswer(playerAnswer) {
    if (playerAnswer !== this.currentQuestionCorrectAnswer) {
      UI.openModal(["Wrong answer. You've lost the game!"]);
      Game.endTheGame();
      return;
    }

    if (this.currentQuestion < MAX_QUESTIONS) {
      UI.selectPrize();

      const newQuestion = await this.generateQuestion();

      UI.answers_btn_container.querySelectorAll("button").forEach((btn) => {
        if (btn.classList.contains("btn--disabled")) UI.activateBtn(btn);
      });

      UI.displayQuestion(newQuestion);
      return;
    }

    if (this.currentQuestion === MAX_QUESTIONS) {
      UI.selectPrize();
      UI.openModal(["You've won a million dollars!"]);
      Game.endTheGame();
      return;
    }
  }

  removeTwoWrongAnswers() {
    if (this.isHelpFiftyUsed) return;

    const NUM_OF_ELEMENTS_REMOVED = 2;
    const filteredWrongAnswers = [];

    randomUniqueMultipleElFromArr(
      this.allRandomWrongAnswers,
      filteredWrongAnswers,
      NUM_OF_ELEMENTS_REMOVED
    );

    const updatedAllRandomWrongAnswers = this.allRandomWrongAnswers.filter(
      (question) => {
        return filteredWrongAnswers.every(
          (wrongQuest) => question !== wrongQuest
        );
      }
    );

    this.allRandomWrongAnswers = updatedAllRandomWrongAnswers;

    this.isHelpFiftyUsed = true;

    return filteredWrongAnswers;
  }

  getAllAnswers() {
    const wrongAnswers = this.allRandomWrongAnswers;
    const allAnswers = [this.currentQuestionCorrectAnswer, ...wrongAnswers];
    return allAnswers;
  }

  calcHelpAnswerPercent(prob) {
    const allAnswers = this.getAllAnswers();
    const allAudiencePercent = 100;
    const restOfAudience = allAudiencePercent - prob;
    return getArrayRandomInts(restOfAudience, allAnswers.length - 1);
  }

  askAudience() {
    if (this.isHelpAudienceUsed) return;

    let audAnsR = [];
    const currDifficultyLvl = this.difficulty;
    let probability = 0;

    switch (currDifficultyLvl) {
      case LEVEL_DIFFICULTY.VERY_EASY:
        probability = getRandomNum(65, 75);
        break;
      case LEVEL_DIFFICULTY.EASY:
        probability = getRandomNum(60, 70);
        break;
      case LEVEL_DIFFICULTY.MEDIUM:
        probability = getRandomNum(45, 55);
        break;
      case LEVEL_DIFFICULTY.HARD:
        probability = getRandomNum(30, 40);
        break;
      case LEVEL_DIFFICULTY.VERY_HARD:
        probability = getRandomNum(20, 30);
        break;
      default:
        probability = getRandomNum(1, 99);
    }

    audAnsR = this.calcHelpAnswerPercent(probability);

    const answersPercent = [probability, ...audAnsR];

    this.isHelpAudienceUsed = true;
    return answersPercent;
  }

  callFriend() {
    if (this.isHelpCallUsed) return;
    UI.openModal([
      `Your friend thinks the correct answer is '${this.currentQuestionCorrectAnswer}'`,
    ]);
    this.isHelpCallUsed = true;
  }

  setNewDifficulty(maxQuest, currQuest, difficulty) {
    const questLeft = maxQuest - currQuest;

    if (
      questLeft === 11 ||
      questLeft === 8 ||
      questLeft === 5 ||
      questLeft === 2
    ) {
      return (difficulty += NEXT_LVL_DIFFICULTY);
    } else {
      return difficulty;
    }
  }

  useHelp(e) {
    const btn = e.target.closest(".help__btn");

    if (!btn) return;

    if (btn.dataset.option === HELP_OPTION_CALL) this.callFriend();

    if (btn.dataset.option === HELP_OPTION_AUDIENCE) {
      const [correct, ...rest] = this.askAudience();
      UI.displayAudienceHelp([correct, ...rest]);
    }

    if (btn.dataset.option === HELP_OPTION_FIFTY) {
      const twoWrongAnswers = this.removeTwoWrongAnswers();
      UI.hideTwoWrongAnswers(twoWrongAnswers);
    }

    UI.disableBtn(btn);
  }

  playerAnswer(e) {
    const btn = e.target.closest(".answer__btn");

    if (!btn) return;

    if (btn.classList.contains("btn--disabled") && btn.disabled) return;

    const playerAnswer = btn.children[0].innerText;

    this.checkAnswer(playerAnswer);
  }
}

UI.play_btn.addEventListener("click", Game.startTheGame);
UI.help_btn_container.addEventListener("click", (e) => {
  thisGame.useHelp(e);
});
UI.answers_btn_container.addEventListener("click", (e) => {
  thisGame.playerAnswer(e);
});
UI.sidebar_btn.addEventListener("click", UI.toggleSidebar.bind(UI));
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  UI.closeModal();
});
UI.modal_close_btn.addEventListener("click", UI.closeModal.bind(UI));
UI.overlay.addEventListener("click", UI.closeModal.bind(UI));
