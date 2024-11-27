import React, { useEffect } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';

const ImageEditor = ({
  task,  // 新增 taskType 参数
  texts = [],
  setTexts,
  customText,
  setCustomText,
  selectedId,
  setSelectedId,
  handleAddText,
  handleDeleteText,
  handleDeselect,
  handleSelect,
  handleDragEnd,
  stageRef,
  transformerRef
}) => {
  // 根据 taskType 动态选择图片


  const image = task.image.url;  // 动态获取图片路径
  const [loadedImage] = useImage(image, 'Anonymous');

  const getDimensions = (imgWidth, imgHeight) => {
    const maxDimension = 480;
    let width = imgWidth;
    let height = imgHeight;

    if (imgWidth > imgHeight) {
      if (imgWidth > maxDimension) {
        width = maxDimension;
        height = (imgHeight * maxDimension) / imgWidth;
      }
    } else {
      if (imgHeight > maxDimension) {
        height = maxDimension;
        width = (imgWidth * maxDimension) / imgHeight;
      }
    }

    return { width, height };
  };

  const dimensions = loadedImage ? getDimensions(loadedImage.width, loadedImage.height) : { width: 600, height: 800 };

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
  }, [selectedId, stageRef, transformerRef]);

  const handleClickOnImage = () => {
    setSelectedId(null);
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setTexts((texts) => {
      const newTexts = texts.map((text) => {
        if (text.id === selectedId) {
          return { ...text, fontSize: newSize };
        }
        return text;
      });
      return newTexts;
    });
  };

  const handleDoubleClick = (e, i) => {
    const newText = prompt("Edit your text:", texts[i].text);
    if (newText !== null) {
      setTexts((texts) => {
        const newTexts = texts.slice();
        newTexts[i] = {
          ...newTexts[i],
          text: newText,
        };
        return newTexts;
      });
    }
  };

  return (
    <div className="image-editor-container">
      <div className="image-container">
        {image && (
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            ref={stageRef}
            onMouseDown={handleDeselect}
          >
            <Layer>
              {loadedImage && (
                <>
                  <Rect
                    x={0}
                    y={0}
                    width={dimensions.width}
                    height={dimensions.height}
                    fillPatternImage={loadedImage}
                    fillPatternScaleX={dimensions.width / loadedImage.width}
                    fillPatternScaleY={dimensions.height / loadedImage.height}
                    cornerRadius={20}
                    onClick={handleClickOnImage}
                    onTap={handleClickOnImage}
                  />
                  <KonvaImage
                    image={loadedImage}
                    x={0}
                    y={0}
                    width={dimensions.width}
                    height={dimensions.height}
                    visible={false}
                  />
                </>
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
                  strokeWidth={textItem.fontSize * 0.05}
                  draggable
                  fontStyle="bold"
                  width={textItem.width || 200}
                  wrap="word"
                  onClick={handleSelect}
                  onTap={handleSelect}
                  onDblClick={(e) => handleDoubleClick(e, i)} // 双击事件
                  onDragEnd={(e) => handleDragEnd(e, i)}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    const newWidth = Math.max(50, node.width() * scaleX);
                    const newHeight = node.height() * scaleY;

                    node.scaleX(1);
                    node.scaleY(1);
                    setTexts((texts) => {
                      const newTexts = texts.slice();
                      newTexts[i] = {
                        ...newTexts[i],
                        x: node.x(),
                        y: node.y(),
                        width: newWidth,
                        height: newHeight,
                      };
                      return newTexts;
                    });
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
        <div className="button-container">
          <button className="btn" onClick={handleAddText} disabled={!customText || !image}>Add Text</button>
          <button className="btn" onClick={handleDeleteText} disabled={!selectedId}>Delete Text</button>
          {selectedId && (
            <div className="font-size-container">
              <label className="font-size-label">
                Font Size:
              </label>
              <input
                type="number"
                value={texts.find(text => text.id === selectedId)?.fontSize || 40}
                onChange={handleFontSizeChange}
                min="5"
                max="100"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;