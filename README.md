# ScholarChat - AI Research Notebook

ScholarChat is a web application inspired by NotebookLM, designed to be an AI-powered research assistant. It helps you upload, analyze, and interact with your source materials in a centralized and intelligent way. This project is built with Next.js, React, Tailwind CSS, and Genkit for its AI capabilities.

## Features

This application provides a robust set of tools to streamline your research process.

### Project Management
- **Create & Manage Projects**: Organize your research into distinct projects. Each project has its own set of sources, a summary, a chat history, and a mind map.
- **Delete Projects**: Easily remove projects you no longer need.

### Source Integration
You can add various types of sources to your projects for analysis:
- **File Uploads**: Upload documents directly from your computer. Supported formats include `.pdf`, `.txt`, and `.docx`.
- **YouTube Videos**: Add a YouTube video by pasting its URL. The application will extract the video's transcript.
- **Website Links**: Add a webpage by pasting its URL. The app will extract the text content from the page.
- **Delete Sources**: Remove individual sources from a project.

### AI-Powered Analysis
For each project, you have access to several AI-driven features:

- **Chat**: Engage in a conversation with an AI assistant that has knowledge of all the documents you've added to the project. The AI can answer questions, explain concepts, and find information for you, citing the specific sources for its answers.
- **Summary**: Generate a concise summary of all the source materials within a project. You can also regenerate this summary at any time.
- **Audio Overview**: Listen to an audio version of your project's summary, perfect for reviewing on the go.
- **Mind Map**: Automatically generate a visual mind map that identifies the key concepts from your sources and shows how they relate to each other and to the source documents.

## Current Limitations (What's Not Included)

This application is currently a demonstration and is not connected to a persistent backend database. Please be aware of the following limitations:

- **No Persistent Storage**: All data, including your projects and sources, is stored in-memory for your current session only. **If you refresh the browser, all your work will be lost.** The application will reset to its initial mock data state.
- **No User Accounts**: There is no login system or user authentication. The experience is the same for every user and is not personalized or saved.

This setup is ideal for demonstration and prototyping purposes. To make this a full-fledged application, the next step would be to integrate a database like Firebase Firestore for data persistence and Firebase Authentication for user management.