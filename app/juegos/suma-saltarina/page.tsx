"use client";

import { useState, useEffect } from "react";

// Página: Suma Saltarina
// Descripción general:
// - Juego de sumas donde el personaje salta hacia la nube que contiene la respuesta correcta.
// - Se generan operaciones (num1 + num2) según el nivel y se muestran varias respuestas en 'nubes'.
// - Se controlan aciertos, intentos, niveles y la UI (feedback, animaciones, pistas).
// - Este archivo contiene las funciones para inicializar la partida, generar operaciones,
//   construir respuestas incorrectas plausibles y controlar la interacción del usuario.

const characters = ['🦸‍♂️', '🧚‍♀️', '🧙‍♂️', '🦊', '🐱', '🐶', '🐰', '🐼', '🐵', '🦁'];

export default function SumaSaltarina() {
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [correctScore, setCorrectScore] = useState(0);
  const [attemptsScore, setAttemptsScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentOperation, setCurrentOperation] = useState(0);
  const [character, setCharacter] = useState('🦸‍♂️');
  const [operation, setOperation] = useState({ num1: 0, num2: 0 });
  const [answers, setAnswers] = useState<number[]>([]);
  const [gameActive, setGameActive] = useState(true);
  const [feedback, setFeedback] = useState({ show: false, correct: false, message: '' });
  const [levelComplete, setLevelComplete] = useState(false);
  const [jumping, setJumping] = useState(false);

  const maxLevel = 5;
  const operationsPerLevel = 5;

  useEffect(() => {
    // Llamada de montaje: inicializa la partida la primera vez que se renderiza el componente.
    startNewGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNewGame() {
    // startNewGame:
    // - Resetea los contadores y estados del nivel/partida.
    // - Selecciona un personaje aleatorio y genera la primera operación.
    setCorrectScore(0);
    setAttemptsScore(0);
    setCurrentOperation(0);
    setGameActive(true);
    setLevelComplete(false);
    
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    setCharacter(randomCharacter);
    
    generateOperation();
  }

  function generateOperation() {
    // generateOperation:
    // - Calcula dos operandos aleatorios ajustados por el nivel y determina la respuesta correcta.
    // - Crea las respuestas distractoras llamando a `generateAnswers`.
    let maxNumber = 10;
    if (currentLevel === 2) maxNumber = 15;
    if (currentLevel >= 3) maxNumber = 20;

    const num1 = Math.floor(Math.random() * maxNumber) + 1;
    const num2 = Math.floor(Math.random() * maxNumber) + 1;
    const correct = num1 + num2;

    setOperation({ num1, num2 });
    setCorrectAnswer(correct);
    
    const generatedAnswers = generateAnswers(correct, maxNumber);
    setAnswers(generatedAnswers);
  }

  function generateAnswers(correctAnswer: number, maxNumber: number) {
    // generateAnswers:
    // - Construye un array con la respuesta correcta y dos respuestas incorrectas que sean plausibles.
    // - Evita duplicados y respuestas demasiado cercanas a la correcta.
    const answers = [correctAnswer];
    
    while (answers.length < 3) {
      const incorrectAnswer = Math.floor(Math.random() * (maxNumber * 2)) + 1;
      if (!answers.includes(incorrectAnswer) && Math.abs(incorrectAnswer - correctAnswer) > 1) {
        answers.push(incorrectAnswer);
      }
    }
    
    return shuffleArray(answers);
  }

  function shuffleArray(array: number[]) {
    // shuffleArray:
    // - Implementa Fisher-Yates para barajar los elementos de forma aleatoria.
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  function handleCloudClick(selectedAnswer: number) {
    // handleCloudClick:
    // - Maneja la interacción del usuario al pulsar una nube (respuesta).
    // - Actualiza intentos y aciertos; activa animaciones y modales según corresponda.
    if (!gameActive) return;

    setAttemptsScore(prev => prev + 1);

    if (selectedAnswer === correctAnswer) {
      setCorrectScore(prev => prev + 1);
      setJumping(true);
      setTimeout(() => setJumping(false), 1000);
      
      setFeedback({
        show: true,
        correct: true,
        message: '¡Muy bien! ¡Respuesta correcta!'
      });

      const newOperation = currentOperation + 1;
      setCurrentOperation(newOperation);

      if (newOperation >= operationsPerLevel) {
        setGameActive(false);
        setTimeout(() => setLevelComplete(true), 1500);
      }
    } else {
      setFeedback({
        show: true,
        correct: false,
        message: 'Ups, esa no es la respuesta. ¡Inténtalo de nuevo!'
      });
    }
  }

  function closeFeedback() {
    // closeFeedback:
    // - Cierra el modal de feedback y, si aún se está jugando, genera la siguiente operación.
    setFeedback({ show: false, correct: false, message: '' });
    if (gameActive) {
      generateOperation();
    }
  }

  function nextLevel() {
    // nextLevel:
    // - Avanza al siguiente nivel (o reinicia si se alcanza el máximo) y reinicia la partida.
    setLevelComplete(false);
    setCurrentLevel(prev => prev < maxLevel ? prev + 1 : 1);
    startNewGame();
  }

  function showHint() {
    // showHint:
    // - Añade un efecto visual temporal a la nube que contiene la respuesta correcta.
    const clouds = document.querySelectorAll('.cloud');
    clouds.forEach((cloud) => {
      const cloudAnswer = parseInt(cloud.getAttribute('data-answer') || '0');
      if (cloudAnswer === correctAnswer) {
        (cloud as HTMLElement).style.boxShadow = '0 0 20px #81C784';
        setTimeout(() => {
          (cloud as HTMLElement).style.boxShadow = '';
        }, 1000);
      }
    });
  }

  return (
    <>
      <header className="w-full bg-gradient-to-r from-sky-400 to-blue-500 py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-yellow-300">Peque</span>
            <span className="text-4xl font-bold text-white">MATHS</span>
          </div>
          <a href="/." className="bg-white text-blue-500 px-6 py-2 rounded-full font-bold hover:bg-yellow-300 hover:text-blue-600 transition-all">
            🏠 Inicio
          </a>
        </div>
      </header>
      
      <main className="flex-1 py-10 bg-gradient-to-br from-sky-100 to-blue-100">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-8 text-center">
              <h1 className="text-4xl font-bold mb-2">➕ Suma Saltarina</h1>
              <p className="text-lg">¡Ayuda al personaje a saltar sobre la nube con la respuesta correcta!</p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Score */}
              <div className="flex justify-between mb-8 bg-gray-100 p-4 rounded-full">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Aciertos:</span>
                  <span className="text-2xl text-purple-600">{correctScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Nivel:</span>
                  <span className="text-2xl text-purple-600">{currentLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Intentos:</span>
                  <span className="text-2xl text-purple-600">{attemptsScore}</span>
                </div>
              </div>

              {/* Game Scene */}
              <div className="relative h-80 bg-gradient-to-b from-sky-200 to-sky-300 rounded-2xl mb-6 overflow-hidden">
                <div className="absolute top-8 right-12 text-6xl animate-spin-slow">☀️</div>
                <div className="absolute top-20 left-8 text-2xl animate-fly">🐦</div>
                
                {/* Operation */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl text-3xl font-bold">
                    {operation.num1} + {operation.num2} = ?
                  </div>
                </div>

                {/* Character */}
                <div className={`absolute bottom-32 left-12 text-6xl transition-all duration-500 ${jumping ? 'animate-jump' : ''}`}>
                  {character}
                </div>

                {/* Clouds */}
                <div className="absolute bottom-12 left-0 right-0 flex justify-around px-8">
                  {answers.map((answer, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCloudClick(answer)}
                      data-answer={answer}
                      className="cloud bg-white rounded-3xl px-6 py-4 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer"
                    >
                      <div className="text-3xl font-bold">{answer}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={startNewGame}
                  className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  🔄 Nuevo Juego
                </button>
                <button
                  onClick={showHint}
                  className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  💡 Pista
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      {feedback.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 text-center max-w-md animate-scale-in">
            <div className={`text-7xl mb-4 ${feedback.correct ? 'text-green-500' : 'text-red-500'}`}>
              {feedback.correct ? '😊' : '😢'}
            </div>
            <h2 className="text-2xl font-bold mb-4">{feedback.message}</h2>
            <button
              onClick={closeFeedback}
              className="bg-blue-500 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {levelComplete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 text-center max-w-md animate-scale-in">
            <div className="text-7xl mb-4 text-yellow-400 animate-spin-slow">⭐</div>
            <h2 className="text-3xl font-bold mb-4 text-purple-600">¡Nivel Completado!</h2>
            <p className="mb-6">¡Felicidades! Has completado el nivel con éxito.</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-3xl font-bold text-blue-500">{correctScore}</div>
                <div className="text-sm text-gray-600">Aciertos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500">{currentLevel}</div>
                <div className="text-sm text-gray-600">Nivel</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500">{attemptsScore}</div>
                <div className="text-sm text-gray-600">Intentos</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={nextLevel}
                className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold"
              >
                ➡️ Siguiente Nivel
              </button>
              <button
                onClick={startNewGame}
                className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-full font-bold"
              >
                🔄 Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes jump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-60px); }
        }
        .animate-jump {
          animation: jump 1s ease-in-out;
        }
        @keyframes fly {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(100vw); }
        }
        .animate-fly {
          animation: fly 20s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}