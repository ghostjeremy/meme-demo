import React, { useState, useRef, useEffect } from "react";
import "./App.css"; // 导入CSS文件
import { Stage, Layer, Text, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';

const App = () => {
  const [image, setImage] = useState(null);
  const [value, setValue] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customText, setCustomText] = useState('');
  const [texts, setTexts] = useState([]);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  const API_URL_UPLOAD = 'http://localhost:8000/upload';
  const API_URL_OPENAI = 'http://localhost:8000/openai';

  const uploadImage = async (e) => {
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    setImage(URL.createObjectURL(e.target.files[0]));
    e.target.value = null;

    try {
      const options = {
        method: 'POST',
        body: formData
      };
      const res = await fetch(API_URL_UPLOAD, options);
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image!");
    }
  };

  const analyzeImage = async () => {
    setError("");
    if (!image) {
      setError("Please upload an image first!");
      return;
    }

    try {
      setLoading(true);
      const options = {
        method: "POST",
        body: JSON.stringify({ message: value }),
        headers: {
          "Content-Type": "application/json"
        }
      };

      const res = await fetch(API_URL_OPENAI, options);
      if (!res.ok) throw new Error("Analysis failed");
      const text = await res.text();
      setChatHistory([...chatHistory, { question: value, answer: text }]);
      setValue("");
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image!");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setImage(null);
    setValue("");
    setChatHistory([]);
    setError("");
    setCustomText("");
    setTexts([]);
    setSelectedId(null);
  };

  // 使用 useImage 钩子加载图片
  const [loadedImage] = useImage(image, 'Anonymous');

  useEffect(() => {
    const transformer = transformerRef.current;
    if (transformer) {
      if (selectedId) {
        const selectedNode = stageRef.current.findOne(`#${selectedId}`);
        if (selectedNode) {
          transformer.nodes([selectedNode]);
          transformer.getLayer().batchDraw();
        }
      } else {
        transformer.nodes([]);
        transformer.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const handleAddText = () => {
    if (stageRef.current && loadedImage) {
      const stage = stageRef.current.getStage();
      const imageWidth = stage.width();
      const imageHeight = stage.height();
      const textWidth = 100; // 假设初始文本宽度
      const textHeight = 24; // 假设初始文本高度
  
      const centerX = (imageWidth - textWidth) / 2;
      const centerY = (imageHeight - textHeight) / 2;
  
      setTexts([...texts, { id: `text-${texts.length + 1}`, text: customText, x: centerX, y: centerY, fontSize: 24 }]);
    }
  };

  const handleDeleteText = () => {
    if (selectedId) {
      setTexts(texts.filter(text => text.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleSelect = (e) => {
    setSelectedId(e.target.id());
    e.cancelBubble = true; // Prevent event propagation to Stage
    console.log('Text selected:', e.target.id());
  };

  const handleDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const clickedOnImage = e.target === stageRef.current.findOne('Image');
    console.log('Clicked on:', e.target);

    if (clickedOnEmpty || clickedOnImage) {
      setSelectedId(null);
      console.log('Stage or image clicked, selection cleared.');
    }
  };

  const handleSave = () => {
    const dataURL = stageRef.current.toDataURL();
    downloadURI(dataURL, 'canvas.png');
    console.log('Canvas saved as image.');
  };

  // function from https://stackoverflow.com/a/15832662/512042
  function downloadURI(uri, name) {
    const link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleDragEnd = (e, i) => {
    const node = e.target;
    const newTexts = texts.slice();
    newTexts[i] = {
      ...newTexts[i],
      x: node.x(),
      y: node.y(),
    };
    setTexts(newTexts);
    console.log('Text dragged to:', { x: node.x(), y: node.y() });
  };

  return (
    <div className="app">
      <div className="toolbar">
        <label htmlFor="files" className="toolbar-button">
          <img src="/upload.png" alt="Upload Icon" className="icon"/>
          Upload
        </label>
        <input onChange={uploadImage} id="files" accept="image/*" type="file" hidden />
        <button onClick={clear} className="toolbar-button">
          <img src="/clear.png" alt="Clear Icon" className="icon"/>
          Reset
        </button>
        <button onClick={handleSave} className="toolbar-button" disabled={!image}>
          <img src="/save.png" alt="Save Icon" className="icon"/>
          Download
        </button>
      </div>
      <div className="container">
        <div className="left-box">
          <div className="image-container">
            {image && (
              <Stage
                width={window.innerWidth * 0.35}
                height={window.innerHeight * 0.6}
                ref={stageRef}
                onMouseDown={handleDeselect}
              >
                <Layer>
                  {loadedImage && (
                    <KonvaImage
                      image={loadedImage}
                      x={0}
                      y={0}
                      width={window.innerWidth * 0.35}
                      height={window.innerHeight * 0.6}
                    />
                  )}
                  {texts.map((textItem, i) => (
                    <Text
                      key={textItem.id}
                      id={textItem.id}
                      text={textItem.text}
                      x={textItem.x}
                      y={textItem.y}
                      fontSize={textItem.fontSize}
                      fill="white"
                      stroke="black"
                      strokeWidth={1}
                      draggable
                      onClick={handleSelect}
                      onTap={handleSelect}
                      onDragEnd={(e) => handleDragEnd(e, i)}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();

                        node.scaleX(1);
                        node.scaleY(1);
                        setTexts((texts) => {
                          const newTexts = texts.slice();
                          newTexts[i] = {
                            ...newTexts[i],
                            x: node.x(),
                            y: node.y(),
                            fontSize: Math.max(5, node.fontSize() * scaleX),
                          };
                          return newTexts;
                        });
                        console.log('Text transformed:', { x: node.x(), y: node.y(), fontSize: node.fontSize() });
                      }}
                    />
                  ))}
                  <Transformer ref={transformerRef} />
                </Layer>
              </Stage>
            )}
          </div>
          <div className="text-controls">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter your text"
              disabled={!image}
            />
            <button onClick={handleAddText} disabled={!customText || !image}>Add Text</button>
            <button onClick={handleDeleteText} disabled={!selectedId}>Delete Text</button>
          </div>
        </div>
        <div className="right-box">
          <div className="chat-container">
            {chatHistory.map((chat, index) => (
              <div key={index} className="chat-message">
                <p><strong>Q:</strong> {chat.question}</p>
                <p><strong>A:</strong> {chat.answer}</p>
              </div>
            ))}
          </div>
          <div className="input-container">
            <input
              value={value}
              placeholder="What is in the image..."
              onChange={e => setValue(e.target.value)}
              disabled={loading}
            />
            <button onClick={analyzeImage} disabled={loading}>Ask me</button>
          </div>
          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
           {error && (
  <div className="error-modal">
    <div className="error-content">
      <p>{error}</p>
      <button onClick={() => setError("")}>Close</button>
    </div>
  </div>
)}</div></div></div>)}

export default App;