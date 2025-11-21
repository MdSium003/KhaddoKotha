# Tesseract OCR Setup Guide

This guide explains the OCR (Optical Character Recognition) functionality in KhaddoKotha. The system uses **Tesseract.js**, a free and open-source OCR engine that works entirely offline.

## ✅ What is Tesseract.js?

- **100% Free** - No API keys, no billing, no costs
- **Open Source** - Powered by Google's Tesseract OCR engine
- **Offline** - Works completely on your server (no external API calls)
- **No Setup Required** - Just install the npm package and it works!

## 🎯 How It Works

1. User uploads a receipt or food label image
2. Tesseract.js extracts all text from the image
3. The system parses the text to identify:
   - ✅ Item names (food products)
   - ✅ Quantities (with units: kg, g, lb, oz, etc.)
   - ✅ Expiration dates (if present)
   - ✅ Purchase dates (if present)

## 📦 Installation

Tesseract.js is already installed! The package is included in `package.json`:

```bash
npm install tesseract.js
```

That's it! No additional setup needed. 🎉

## 🚀 Usage

The OCR endpoint is automatically available at:

```
POST /api/ocr/extract
```

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `image` field (JPG/PNG file)
- Headers: `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "fullText": "extracted text from image...",
  "extractedItems": [
    { "name": "Milk", "confidence": 0.7 }
  ],
  "extractedQuantities": [
    { "value": "1", "unit": "liter", "confidence": 0.7 }
  ],
  "extractedDates": [
    { "type": "expiration", "value": "12/31/2024", "confidence": 0.9 }
  ],
  "summary": "Found 5 items, 3 quantities, and 1 dates"
}
```

## 🎨 Features

### Supported Image Formats
- ✅ JPG/JPEG
- ✅ PNG
- Maximum file size: 5MB

### What Can Be Extracted
- **Food Items**: Milk, Bread, Eggs, Chicken, etc.
- **Quantities**: 1 liter, 500g, 2 lbs, etc.
- **Dates**: Expiration dates, purchase dates, sell-by dates
- **Any Text**: Full text extraction from receipts and labels

## 🔧 Configuration

No configuration needed! Tesseract.js works out of the box.

**Optional**: You can customize the language by modifying the OCR endpoint:
```javascript
await Tesseract.recognize(imagePath, 'eng+spa+fra'); // English + Spanish + French
```

See [Tesseract.js documentation](https://github.com/naptha/tesseract.js) for supported languages.

## 📊 Performance

- **Speed**: Typically 1-5 seconds per image (depends on image size and complexity)
- **Accuracy**: High accuracy for clear, well-lit images
- **Memory**: Minimal memory footprint
- **CPU**: Moderate CPU usage during OCR processing

## 💡 Tips for Best Results

1. **Image Quality**: 
   - Use clear, well-lit photos
   - Avoid blurry or dark images
   - Ensure text is readable in the original image

2. **Image Orientation**:
   - Ensure text is right-side up
   - Crop to focus on the relevant area

3. **File Size**:
   - Smaller images process faster
   - Maximum 5MB per image

4. **Text Clarity**:
   - Printed text works better than handwriting
   - High contrast images (black text on white) work best

## 🐛 Troubleshooting

### OCR not extracting text correctly
- **Check image quality**: Ensure the image is clear and text is readable
- **Try a different image**: Some images may be too blurry or low quality
- **Check image orientation**: Make sure text is right-side up

### Slow processing
- **Normal behavior**: OCR can take 1-5 seconds depending on image size
- **First run**: May take longer as Tesseract downloads language data
- **Large images**: Consider resizing images before upload

### No items found after extraction
- **Check extracted text**: Look at the `fullText` field in the response
- **Manual parsing**: The parsing logic looks for common food keywords
- **Customize parser**: You can modify the `parseReceiptText` function to match your needs

## 🔐 Security

- ✅ No external API calls (completely offline)
- ✅ No sensitive data sent to third parties
- ✅ All processing happens on your server
- ✅ Images are stored securely in the `uploads/` directory

## 📚 Additional Resources

- [Tesseract.js GitHub](https://github.com/naptha/tesseract.js)
- [Tesseract OCR Documentation](https://tesseract-ocr.github.io/)
- [Supported Languages](https://github.com/tesseract-ocr/tesseract/wiki/Data-Files)

## 🎉 Summary

**No setup required!** Tesseract.js is:
- ✅ Already installed
- ✅ Already configured
- ✅ Ready to use
- ✅ 100% free

Just upload an image through the inventory or daily tracker pages, and the OCR will automatically extract text!

---

**Next Steps**: In the next part, we'll implement automatic inventory addition with user confirmation prompts for extracted data.

