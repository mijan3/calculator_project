"use strict";

/*Select html*/

const previousOperationElement = document.getElementById(
    "previousOperation"
);

const currentOperationElement = document.getElementById(
    "currentOperation"
);

const numberButtons = document.querySelectorAll("[data-number]");
const operatorButtons = document.querySelectorAll("[data-operator]");
const actionButtons = document.querySelectorAll("[data-action]");

/* Calculator State */

let currentInput = "0";
let expression = "";
let waitingForNumber = false;
let calculationCompleted = false;

/* Update Calculator Display */

function updateDisplay() {
    currentOperationElement.textContent = formatDisplayNumber(currentInput);

    previousOperationElement.textContent = formatExpression(expression);

    currentOperationElement.scrollLeft =
        currentOperationElement.scrollWidth;

    previousOperationElement.scrollLeft =
        previousOperationElement.scrollWidth;
}

/* Format Display Values */

function formatDisplayNumber(value) {
    if (value === "Error") {
        return value;
    }

    if (value === "-") {
        return value;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return value;
    }

    const [integerPart, decimalPart] = value.split(".");

    const formattedInteger = Number(integerPart).toLocaleString("en-US");

    if (decimalPart !== undefined) {
        return `${formattedInteger}.${decimalPart}`;
    }

    return formattedInteger;
}

function formatExpression(value) {
    return value
        .replaceAll("*", "×")
        .replaceAll("/", "÷")
        .replaceAll("-", "−");
}

/* Number Input */

function inputNumber(number) {
    if (
        calculationCompleted ||
        waitingForNumber ||
        currentInput === "Error"
    ) {
        currentInput = number;
        waitingForNumber = false;
        calculationCompleted = false;

        updateDisplay();
        return;
    }

    if (currentInput === "0") {
        currentInput = number;
    } else if (currentInput.length < 18) {
        currentInput += number;
    }

    updateDisplay();
}

/*Decimal Input*/

function inputDecimal() {
    if (
        calculationCompleted ||
        waitingForNumber ||
        currentInput === "Error"
    ) {
        currentInput = "0.";
        waitingForNumber = false;
        calculationCompleted = false;

        updateDisplay();
        return;
    }

    if (!currentInput.includes(".")) {
        currentInput += ".";
    }

    updateDisplay();
}

/*Operator Input*/

function inputOperator(operator) {
    if (currentInput === "Error") {
        clearCalculator();
        return;
    }

    if (calculationCompleted) {
        expression = `${currentInput} ${operator} `;
        waitingForNumber = true;
        calculationCompleted = false;

        updateDisplay();
        return;
    }

    if (waitingForNumber) {
        expression = expression.replace(
            /[+\-*/]\s*$/,
            `${operator} `
        );

        updateDisplay();
        return;
    }

    expression += `${currentInput} ${operator} `;
    waitingForNumber = true;

    updateDisplay();
}

/* Calculate Result */

function calculateResult() {
    if (
        expression === "" ||
        waitingForNumber ||
        currentInput === "Error"
    ) {
        return;
    }

    const fullExpression = `${expression}${currentInput}`;

    try {
        const result = evaluateExpression(fullExpression);

        previousOperationElement.textContent =
            `${formatExpression(fullExpression)} =`;

        currentInput = formatResult(result);
        expression = "";
        waitingForNumber = false;
        calculationCompleted = true;

        currentOperationElement.textContent =
            formatDisplayNumber(currentInput);
    } catch (error) {
        showError();
    }
}

/*Safe Expression Evaluation*/

function evaluateExpression(value) {
    const allowedCharacters = /^[0-9+\-*/.\s]+$/;

    if (!allowedCharacters.test(value)) {
        throw new Error("Invalid expression");
    }

    const result = Function(
        `"use strict"; return (${value});`
    )();

    if (!Number.isFinite(result)) {
        throw new Error("Invalid calculation");
    }

    return result;
}

/*Format Calculation Result*/

function formatResult(result) {
    const roundedResult = Number(result.toFixed(10));

    return roundedResult.toString();
}

/*Clear Calculator*/

function clearCalculator() {
    currentInput = "0";
    expression = "";
    waitingForNumber = false;
    calculationCompleted = false;

    updateDisplay();
}

/*Delete Last Number*/

function deleteLastDigit() {
    if (
        currentInput === "Error" ||
        calculationCompleted
    ) {
        clearCalculator();
        return;
    }

    if (waitingForNumber) {
        return;
    }

    if (
        currentInput.length === 1 ||
        (
            currentInput.startsWith("-") &&
            currentInput.length === 2
        )
    ) {
        currentInput = "0";
    } else {
        currentInput = currentInput.slice(0, -1);
    }

    updateDisplay();
}

/* Percentage */

function calculatePercentage() {
    if (
        currentInput === "Error" ||
        waitingForNumber
    ) {
        return;
    }

    const number = Number(currentInput);

    if (!Number.isFinite(number)) {
        showError();
        return;
    }

    currentInput = formatResult(number / 100);
    calculationCompleted = false;

    updateDisplay();
}

/* Positive or Negative */

function toggleSign() {
    if (
        currentInput === "0" ||
        currentInput === "Error" ||
        waitingForNumber
    ) {
        return;
    }

    if (currentInput.startsWith("-")) {
        currentInput = currentInput.slice(1);
    } else {
        currentInput = `-${currentInput}`;
    }

    updateDisplay();
}

/*Error Handling*/

function showError() {
    currentInput = "Error";
    expression = "";
    waitingForNumber = false;
    calculationCompleted = true;

    updateDisplay();
}

/* Button Click Events */

numberButtons.forEach((button) => {
    button.addEventListener("click", () => {
        inputNumber(button.dataset.number);
    });
});

operatorButtons.forEach((button) => {
    button.addEventListener("click", () => {
        inputOperator(button.dataset.operator);
    });
});

actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;

        switch (action) {
            case "clear":
                clearCalculator();
                break;

            case "delete":
                deleteLastDigit();
                break;

            case "decimal":
                inputDecimal();
                break;

            case "percentage":
                calculatePercentage();
                break;

            case "toggle-sign":
                toggleSign();
                break;

            case "calculate":
                calculateResult();
                break;

            default:
                break;
        }
    });
});

/* Keyboard Support */

document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        inputNumber(key);
        highlightKeyboardButton(`[data-number="${key}"]`);
        return;
    }

    if (["+", "-", "*", "/"].includes(key)) {
        event.preventDefault();

        inputOperator(key);
        highlightKeyboardButton(`[data-operator="${key}"]`);
        return;
    }

    if (key === "." || key === ",") {
        event.preventDefault();

        inputDecimal();
        highlightKeyboardButton('[data-action="decimal"]');
        return;
    }

    if (key === "Enter" || key === "=") {
        event.preventDefault();

        calculateResult();
        highlightKeyboardButton('[data-action="calculate"]');
        return;
    }

    if (key === "Backspace") {
        event.preventDefault();

        deleteLastDigit();
        highlightKeyboardButton('[data-action="delete"]');
        return;
    }

    if (key === "Escape" || key === "Delete") {
        event.preventDefault();

        clearCalculator();
        highlightKeyboardButton('[data-action="clear"]');
        return;
    }

    if (key === "%") {
        event.preventDefault();

        calculatePercentage();
        highlightKeyboardButton('[data-action="percentage"]');
    }
});

/*Keyboard Button Animation*/

function highlightKeyboardButton(selector) {
    const button = document.querySelector(selector);

    if (!button) {
        return;
    }

    button.classList.add("active");

    window.setTimeout(() => {
        button.classList.remove("active");
    }, 120);
}

/* Initial Display */

updateDisplay();