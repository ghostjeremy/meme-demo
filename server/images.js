const path = require('path');
const fs = require('fs').promises;
const { Router } = require('express');
const { IMAGES_DIR } = require('./constants');

const router = new Router();

router.post('/users/:participantId/tasks/:taskIndex/images', async (req, res) => {
  const { participantId, taskIndex } = req.params;
  const { images, imgIndex } = req.body;
  if (!participantId) {
    return res.status(404).json({ message: 'Unknown user' });
  }

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const userDir = path.join(IMAGES_DIR, participantId);

  try {
    await fs.access(userDir);
  } catch {
    await fs.mkdir(userDir);
  }

  const imagePaths = [ ];

  await Promise.all(images.map(async (imageData) => {
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const imagePath = path.join(userDir, `image-${taskIndex}-${imgIndex}.png`);
    await fs.writeFile(imagePath, base64Data, 'base64');
    imagePaths.push(imagePath);
  }));

  res.status(200).json({ message: 'Images saved successfully', images: imagePaths });
});

// // Endpoint to download images
// router.get('/downloadImage', (req, res) => {
//   const { path: imagePath } = req.query;
//   res.download(imagePath, (err) => {
//     if (err) {
//       res.status(500).json({ message: 'Failed to download image' });
//     }
//   });
// });




module.exports = router;