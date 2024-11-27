import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import ImageEditor from './ImageEditor';

const ImageEditorWrapper = forwardRef(({ description, task, disabled }, ref) => {  // 添加 taskType 作为参数
  // TODO disabled
  const [texts, setTexts] = useState([]);
  const [customText, setCustomText] = useState(description); // 初始化 customText 为 description
  const [selectedId, setSelectedId] = useState(null);

  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getImageData() {
      return stageRef.current.toDataURL();
    },
    handleDeselect() {
      setSelectedId(null);
    }
  }));

  const handleAddText = () => {
    const id = `text${Date.now()}`;
    const stage = stageRef.current;
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;
    setTexts(prevTexts => [...prevTexts, { id, text: customText, x: centerX, y: centerY, fontSize: 40 }]);
    setCustomText("");
  };

  const handleDeleteText = () => {
    setTexts(prevTexts => prevTexts.filter(text => text.id !== selectedId));
    setSelectedId(null);
  };

  const handleDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const handleSelect = (e) => {
    setSelectedId(e.target.id());
  };

  const handleDragEnd = (e, i) => {
    const newTexts = texts.slice();
    newTexts[i] = {
      ...newTexts[i],
      x: e.target.x(),
      y: e.target.y()
    };
    setTexts(newTexts);
  };

  return (
    <div>
      <div className="idea-container">
        <p className="idea-description">{description}</p>
      </div>
      <ImageEditor
        task={task}  // 将 taskType 传递给 ImageEditor
        texts={texts}
        setTexts={setTexts}
        customText={customText}
        setCustomText={setCustomText}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        handleAddText={handleAddText}
        handleDeleteText={handleDeleteText}
        handleDeselect={handleDeselect}
        handleSelect={handleSelect}
        handleDragEnd={handleDragEnd}
        stageRef={stageRef}
        transformerRef={transformerRef}
      />
    </div>
  );
});

export default ImageEditorWrapper;