import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ExamLayout from '../layouts/ExamLayout';

// Components
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import UploadPDF from '../pages/UploadPDF';
import GenerateTest from '../pages/GenerateTest';
import Assistant from '../pages/Assistant';
import MockInterviewHub from '../pages/MockInterviewHub';
import MockInterviewWorkspace from '../pages/MockInterviewWorkspace';
import MockInterviewReport from '../pages/MockInterviewReport';
import TakeTest from '../pages/TakeTest';
import Results from '../pages/Results';
import Analytics from '../pages/Analytics';
import Profile from '../pages/Profile';
import LearningHub from '../pages/LearningHub';
import LearningSubject from '../pages/LearningSubject';
import LearningNotesViewer from '../pages/LearningNotesViewer';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Public Routes - Login / Register */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected Routes - Dashboard Views */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload-pdf" element={<UploadPDF />} />
          <Route path="/generate-test/:type" element={<GenerateTest />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/mock-interview" element={<MockInterviewHub />} />
          <Route path="/mock-interview/report/:id" element={<MockInterviewReport />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learning-hub" element={<LearningHub />} />
          <Route path="/learning-hub/:branch/:subjectId" element={<LearningSubject />} />
          <Route path="/learning-hub/:branch/:subjectId/:topicId" element={<LearningNotesViewer />} />
        </Route>

        {/* Dedicated Full-Screen Mock Interview Route */}
        <Route path="/mock-interview/session/:id" element={<MockInterviewWorkspace />} />

        {/* Protected Routes - Distraction-Free Exam View */}
        <Route element={<ExamLayout />}>
          <Route path="/take-test/:id" element={<TakeTest />} />
        </Route>
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
