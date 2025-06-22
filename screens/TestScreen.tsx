import React from 'react';
import Button from '../components/Button';

const TestScreen = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pantalla de Prueba</h1>
      
      <div className="mb-4">
        <h2 className="text-lg mb-2">Botones HTML nativos:</h2>
        <button 
          onClick={() => alert('HTML Button 1 Works!')} 
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            margin: '5px'
          }}
        >
          HTML Button 1
        </button>
        <button 
          onClick={() => alert('HTML Button 2 Works!')} 
          style={{
            backgroundColor: 'blue',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            margin: '5px'
          }}
        >
          HTML Button 2
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg mb-2">Componente Button:</h2>
        <Button onClick={() => alert('Button Component 1 Works!')} className="mr-2">
          Button Component 1
        </Button>
        <Button onClick={() => alert('Button Component 2 Works!')} variant="danger">
          Button Component 2
        </Button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg mb-2">Tailwind Classes:</h2>
        <button className="bg-green-500 text-white px-4 py-2 rounded mr-2" onClick={() => alert('Tailwind Button Works!')}>
          Tailwind Button
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="bg-red-500 text-white p-2 rounded">Grid Button 1</button>
        <button className="bg-orange-500 text-white p-2 rounded">Grid Button 2</button>
        <button className="bg-green-500 text-white p-2 rounded">Grid Button 3</button>
        <button className="bg-blue-500 text-white p-2 rounded">Grid Button 4</button>
      </div>
    </div>
  );
};

export default TestScreen;
