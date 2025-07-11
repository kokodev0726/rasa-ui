import './chatBot.css';
import react, { useEffect, useState, useRef } from 'react';
import {IoMdSend, IoMdMic}  from 'react-icons/io';
import {BiBot,BiUser} from 'react-icons/bi';

function Basic(){
    const [chat,setChat] = useState([]);
    const [inputMessage,setInputMessage] = useState('');
    const [botTyping,setbotTyping] = useState(false);
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);

    useEffect(()=>{
        const objDiv = document.getElementById('messageArea');
        objDiv.scrollTop = objDiv.scrollHeight;
    },[chat])

    const handleSubmit=(evt)=>{
        evt.preventDefault();
        const name = "shreyas";
        const request_temp = {sender : "user", sender_id : name , msg : inputMessage};

        if(inputMessage !== ""){
            setChat(chat => [...chat, request_temp]);
            setbotTyping(true);
            setInputMessage('');
            rasaAPI(name,inputMessage);
        }
        else{
            window.alert("Please enter valid message");
        }
    }

    const rasaAPI = async function handleClick(name,msg) {
        await fetch('http://187.33.155.76:5005/webhooks/rest/webhook', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'charset':'UTF-8',
            },
            credentials: "same-origin",
            body: JSON.stringify({ "sender": name, "message": msg }),
        })
        .then(response => response.json())
        .then((response) => {
            if(response){
                const temp = response[0];
                const recipient_id = temp["recipient_id"];
                const recipient_msg = temp["text"];

                const response_temp = {sender: "bot",recipient_id : recipient_id,msg: recipient_msg};
                setbotTyping(false);
                setChat(chat => [...chat, response_temp]);
                playBotAudio(recipient_msg);
            }
        }) 
    }

    // OpenAI API keys and endpoints should be stored securely, here placeholders are used
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    // Function to send audio blob to OpenAI STT and get transcription
    const transcribeAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: formData
        });

        if (!response.ok) {
            console.error('OpenAI STT API error', await response.text());
            return '';
        }

        const data = await response.json();
        return data.text || '';
    };

    // Function to get TTS audio from OpenAI and play it
    const playBotAudio = async (text) => {
        // For TTS, OpenAI does not have a direct TTS endpoint as of now.
        // We can use third-party TTS or browser SpeechSynthesis as fallback.
        // Here, using browser SpeechSynthesis API for TTS playback.

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech Synthesis not supported in this browser.');
        }
    };

    // Start recording audio
    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Audio recording is not supported in this browser.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const transcription = await transcribeAudio(audioBlob);
                console.log("=============transcription================");
                console.log(transcription);
                if (transcription) {
                    const name = "shreyas";
                    const request_temp = {sender : "user", sender_id : name , msg : transcription};
                    setChat(chat => [...chat, request_temp]);
                    setbotTyping(true);
                    rasaAPI(name, transcription);
                }
            };

            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (err) {
            console.error('Error accessing microphone', err);
            alert('Could not start audio recording.');
        }
    };

    // Stop recording audio
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const toggleRecording = () => {
        if (recording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const stylecard = {
        maxWidth : '35rem',
        border: '1px solid black',
        paddingLeft: '0px',
        paddingRight: '0px',
        borderRadius: '30px',
        boxShadow: '0 16px 20px 0 rgba(0,0,0,0.4)'
    }
    const styleHeader = {
        height: '4.5rem',
        borderBottom : '1px solid black',
        borderRadius: '30px 30px 0px 0px',
        backgroundColor: '#8012c4',
    }
    const styleFooter = {
        borderTop : '1px solid black',
        borderRadius: '0px 0px 30px 30px',
        backgroundColor: '#8012c4',
    }
    const styleBody = {
        paddingTop : '10px',
        height: '28rem',
        overflowY: 'auto',
        overflowX: 'hidden',
    }

    return (
      <div>
        <div className="container">
        <div className="row justify-content-center">
            <div className="card" style={stylecard}>
                <div className="cardHeader text-white" style={styleHeader}>
                    <h1 style={{marginBottom:'0px'}}>UNIBOT SUPPORT</h1>
                    {botTyping ? <h6>Bot Typing....</h6> : null}
                </div>
                <div className="cardBody" id="messageArea" style={styleBody}>
                    <div className="row msgarea">
                        {chat.map((user,key) => (
                            <div key={key}>
                                {user.sender==='bot' ? (
                                    <div className= 'msgalignstart'>
                                        <BiBot className="botIcon"  /><h5 className="botmsg">{user.msg}</h5>
                                    </div>
                                ) : (
                                    <div className= 'msgalignend'>
                                        <h5 className="usermsg">{user.msg}</h5><BiUser className="userIcon" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="cardFooter text-white" style={styleFooter}>
                    <div className="row" style={{alignItems: 'center'}}>
                        <form style={{display: 'flex', flexGrow: 1}} onSubmit={handleSubmit}>
                            <div className="col-2 " style={{paddingLeft:'10px', display: 'flex', alignItems: 'center'}}>
                                <button onClick={toggleRecording} type="button" className="circleBtn">
                                    <IoMdMic className="sendBtn" />
                                </button>
                            </div>
                            <div className="col-8" style={{paddingRight:'0px'}}>
                                <input onChange={e => setInputMessage(e.target.value)} value={inputMessage} type="text" className="msginp"></input>
                            </div>
                            <div className="col-2 cola">
                                <button type="submit" className="circleBtn" ><IoMdSend className="sendBtn" /></button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </div>
      </div>
    );
}

export default Basic;
