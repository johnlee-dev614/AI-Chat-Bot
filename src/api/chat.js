const API_CHAT = "http://localhost:8000/chat"
const API_VOICE = "http://localhost:8000/voice"

export const sendMessage = async (message) => {
    const response = await fetch(`http://localhost:8000/chat?message=${encodeURIComponent(message)}`);
    const data = await response.json();
    return data;
  };
  
  export const getVoice = async (text) => {
    const response = await fetch(`http://localhost:8000/voice?text=${encodeURIComponent(text)}`);
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  };