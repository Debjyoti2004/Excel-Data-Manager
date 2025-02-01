# Excel Data Importer 🚀

![Excel Data Importer Homepage](./image.png)  
**Live Demo:** [https://excel-data-importer.vercel.app](https://excel-data-importer.vercel.app)

A robust solution for importing and validating Excel (.xlsx) files with real-time error handling, data preview, and seamless MongoDB integration.

---

## Features ✨
- **Drag-and-Drop File Upload** with fallback input
- **Multi-Sheet Validation** & error reporting via modal dialogs
- **Interactive Data Preview** with pagination and row deletion
- **Dynamic Formatting** (Dates: `DD-MM-YYYY`, Numbers: Indian comma format)
- **Scalable Backend** with configurable validation rules
- **MongoDB Integration** for efficient data storage

## Tech Stack 🛠️

| Frontend               | Backend               | Database          |
|------------------------|-----------------------|-------------------|
| React.js               | Node.js/Express.js    | MongoDB Atlas     |
| Tailwind CSS           | ExcelJS (XLSX parser) | Mongoose ODM      |
| Vite                   | Joi (Validation)      | Aggregation Pipeline |
| React-icons            | CORS                  | Atlas Search      |

---

## Installation 📦

### 1. Clone the repository
```bash
git clone https://github.com/Debjyoti2004/Excel-Data-Manager.git
```

### 2. Install dependencies
```bash
# Frontend
cd client && npm install 

# Backend
cd ../server && npm install
```

### 3. Configure Environment Variables

#### Frontend (`.env.local`):
```env
VITE_BACKEND_URL = <URL>
```

#### Backend (`.env`):
```env
MONGODB_URI = <URL>
FRONTEND_URL = <URL>
```

### 4. Start Applications
```bash
# Frontend
cd client && npm run dev

# Backend
cd server && npm run server
```

---

## Project Structure 📁

### Client
```
src/
├─ components/
│  ├─ FileUpload.jsx   # Drag-n-drop UI + validation
│  ├─ DataManager.jsx  # Paginated table + row deletion
│  └─ ErrorModal.jsx   # Multi-sheet error display
├─ context/
│  └─ ThemeContext.jsx # Dark/Light mode (optional)
└─ App.jsx             # Routing & state management
```

### Server
```
server/
├─ config/
│  └─ mongodb.js       # DB connection setup
├─ controller/
│  └─ excelController.js # Core validation logic
├─ validation/
│  └─ schemaConfig.js  # Rules for different sheets
└─ model/
   └─ DataModel.js     # Mongoose schema design
```

---

## Sample Validation Files 🔍

### Valid File (`sample_valid.xlsx`)
✅ Columns: Name | Amount | Date | Verified  
✅ Contains data for current month  
✅ All mandatory fields populated  

### Invalid File (`sample_errors.xlsx`)
❌ Missing "Name" in Row 3  
❌ Invalid date format in Row 7  
❌ Negative amount in Row 12  

[Download Sample Valid File](https://github.com/your-username/excel-data-importer/raw/main/samples/sample_valid.xlsx)  
[Download Sample Error File](https://github.com/your-username/excel-data-importer/raw/main/samples/sample_errors.xlsx)


---

## Testing 🧪

### Frontend Validation
- Try uploading non-XLSX files
- Test 2MB+ file size rejection
- Verify date/number formatting

---

## License 📄
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

## Acknowledgments 🙏
- **ExcelJS** team for excellent XLSX parsing library
- **MongoDB Atlas** for free tier database
- **Vercel** for seamless deployment

---

**Built with ❤️ by Debjyoti Shit**
