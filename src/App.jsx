import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import PropTypes from 'prop-types';

// Timer Component: Displays the countdown timer
const Timer = ({ initialTime, finishQuiz }) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  useEffect(() => {
    // If time runs out, finish the quiz
    if (timeRemaining === 0) {
      finishQuiz();
    }

    const timerId = setInterval(() => {
      if (timeRemaining > 0) {
        setTimeRemaining((prevTime) => prevTime - 1); // Decrement the timer every second
      }
    }, 1000);

    return () => clearInterval(timerId); // Clean up the interval when the component is unmounted
  }, [timeRemaining, finishQuiz]);

  return <div className="timer">Time Remaining: {timeRemaining}s</div>;
};

Timer.propTypes = {
  initialTime: PropTypes.number.isRequired, // Initial time for the timer
  finishQuiz: PropTypes.func.isRequired,    // Function to call when time is up
};

// Question Component: Displays the current question and answer options
const Question = ({ question, handleAnswer, questionIndex, selectedAnswer }) => {
  return (
    <div className="question">
      <h3>{question.description}</h3>
      <div className="options">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option.description;
          const isCorrect = option.is_correct && isSelected;

          return (
            <button
              key={index}
              onClick={() => handleAnswer(questionIndex, option.description)}
              className={`option-btn ${isSelected ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
            >
              {option.description}
            </button>
          );
        })}
      </div>
    </div>
  );
};

Question.propTypes = {
  question: PropTypes.object.isRequired,      // The current question
  handleAnswer: PropTypes.func.isRequired,   // Function to handle answer selection
  questionIndex: PropTypes.number.isRequired,// Index of the current question
  selectedAnswer: PropTypes.string,          // The answer selected by the user
};

// Result Component: Displays the score at the end of the quiz
const Result = ({ score, totalQuestions, restartQuiz }) => {
  return (
    <div className="result">
      <h2>Quiz Completed!</h2>
      <p>Your Score: {score} / {totalQuestions}</p>
      <button onClick={restartQuiz} className="restart-btn">Restart Quiz</button>
    </div>
  );
};

Result.propTypes = {
  score: PropTypes.number.isRequired,           // The user's score
  totalQuestions: PropTypes.number.isRequired,  // Total number of questions
  restartQuiz: PropTypes.func.isRequired,       // Function to restart the quiz
};

// Main App Component
function App() {
  const [quizData, setQuizData] = useState(null);  // Holds quiz data
  const [userAnswers, setUserAnswers] = useState([]);  // Tracks user's answers
  const [quizStarted, setQuizStarted] = useState(false);  // If quiz has started
  const [quizFinished, setQuizFinished] = useState(false); // If quiz has finished
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Index of the current question
  const [timeRemaining, setTimeRemaining] = useState(120);  // Timer set to 2 minutes

  // Fetch quiz data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/Uw5CrX'); // Update with your actual API endpoint
        setQuizData(response.data); // Store the quiz data in state
      } catch (error) {
        console.error("Error fetching quiz data:", error);
      }
    };
    fetchData();
  }, []);

  // Handle answer selection and store the user's answer
  const handleAnswer = (questionIndex, selectedAnswer) => {
    if (userAnswers[questionIndex]) return;  // Prevent selecting an answer more than once

    setUserAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];
      newAnswers[questionIndex] = selectedAnswer;
      return newAnswers;
    });
  };

  // Calculate the user's score by comparing selected answers with correct answers
  const calculateScore = () => {
    let score = 0;
    quizData.questions.forEach((question, index) => {
      const correctOption = question.options.find(option => option.is_correct);
      if (userAnswers[index] === correctOption.description) {
        score++;
      }
    });
    return score;
  };

  // Start the quiz and reset the timer
  const startQuiz = () => {
    setQuizStarted(true);
    setTimeRemaining(120);  // Reset timer to 2 minutes
    setCurrentQuestionIndex(0);  // Start from the first question
  };

  // Finish the quiz and show the results
  const finishQuiz = () => {
    setQuizFinished(true);
  };

  // Navigate to the next question
  const nextQuestion = () => {
    if (userAnswers[currentQuestionIndex]) {
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  // Navigate to the previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Restart the quiz
  const restartQuiz = () => {
    setUserAnswers([]);
    setQuizStarted(false);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setTimeRemaining(120);
  };

  // If quiz data is still being fetched, show a loading message
  if (!quizData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      {/* Start Screen */}
      {!quizStarted ? (
        <div className="start-screen">
          <h1>{quizData.title}</h1>
          <p>{quizData.description}</p>
          <button onClick={startQuiz} className="start-btn">Start Quiz</button>
        </div>
      ) : (
        // Quiz Screen
        <div className="quiz-screen">
          {!quizFinished ? (
            <div>
              {/* Timer */}
              <Timer initialTime={timeRemaining} finishQuiz={finishQuiz} />

              {/* Question Navigation */}
              <div className="question-navigation">
                <h3>Question {currentQuestionIndex + 1} of {quizData.questions.length}</h3>
              </div>

              {/* Question Component */}
              <Question
                question={quizData.questions[currentQuestionIndex]}
                questionIndex={currentQuestionIndex}
                handleAnswer={handleAnswer}
                selectedAnswer={userAnswers[currentQuestionIndex]}
              />

              {/* Navigation Buttons */}
              <div className="navigation-buttons">
                {currentQuestionIndex > 0 && (
                  <button onClick={prevQuestion} className="prev-btn">Previous</button>
                )}
                <button
                  onClick={nextQuestion}
                  className="next-btn"
                  disabled={!userAnswers[currentQuestionIndex]}
                >
                  Next
                </button>
                {currentQuestionIndex === quizData.questions.length - 1 && (
                  <button onClick={finishQuiz} className="finish-btn">Finish Quiz</button>
                )}
              </div>
            </div>
          ) : (
            // Results Screen
            <Result score={calculateScore()} totalQuestions={quizData.questions.length} restartQuiz={restartQuiz} />
          )}
        </div>
      )}

      <div className="dev-box">
        <p className="dev-text">
          Designed and coded by 👉
          <a href="https://yrj-web.vercel.app/" target="_blank" className="web-link">
            Yuvraj
          </a>
          <span>👨‍💻</span>
        </p>
      </div>

    </div>
  );
}

export default App;
