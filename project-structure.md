# Project Structure

📄 README.md (README.md)
📁 backend/
  📁 data/
    📄 CVE-2024-9143-1738985832767.json (backend/data/CVE-2024-9143-1738985832767.json)
    📁 screenshots/
    📄 stackoverflow-1738985775363.json (backend/data/stackoverflow-1738985775363.json)
    📄 stackoverflow-1738985878068.json (backend/data/stackoverflow-1738985878068.json)
  📄 package.json (backend/package.json)
  📄 server.js (backend/server.js)
  📁 services/
    📁 scraping/
      📄 stackoverflowScraper.js (backend/services/scraping/stackoverflowScraper.js)
📄 eslint.config.js (eslint.config.js)
📄 index.html (index.html)
📄 map-project.js (map-project.js)
📄 package.json (package.json)
📄 postcss.config.js (postcss.config.js)
📄 project-structure.md (project-structure.md)
📁 public/
📁 src/
  📄 App.css (src/App.css)
  📄 App.jsx (src/App.jsx)
  📁 assets/
  📁 components/
    📁 auth/
      📄 AWSAuthForm.jsx (src/components/auth/AWSAuthForm.jsx)
      📄 ProtectedRoute.jsx (src/components/auth/ProtectedRoute.jsx)
    📁 layout/
      📄 MainLayout.jsx (src/components/layout/MainLayout.jsx)
      📄 Navbar.jsx (src/components/layout/Navbar.jsx)
      📄 Sidebar.jsx (src/components/layout/Sidebar.jsx)
    📁 repositories/
      📄 ImageDetailsModal.jsx (src/components/repositories/ImageDetailsModal.jsx)
      📄 RepositoryAnalysis.jsx (src/components/repositories/RepositoryAnalysis.jsx)
      📄 RepositoryAnalysisPage.jsx (src/components/repositories/RepositoryAnalysisPage.jsx)
    📁 ui/
      📄 ModalPortal.jsx (src/components/ui/ModalPortal.jsx)
      📄 alert.jsx (src/components/ui/alert.jsx)
    📁 vulnerability/
      📄 SeverityBadge.jsx (src/components/vulnerability/SeverityBadge.jsx)
      📄 SourceSelector.jsx (src/components/vulnerability/SourceSelector.jsx)
  📄 index.css (src/index.css)
  📄 main.jsx (src/main.jsx)
  📁 pages/
    📁 auth/
      📄 Login.jsx (src/pages/auth/Login.jsx)
    📁 dashboard/
      📄 Dashboard.jsx (src/pages/dashboard/Dashboard.jsx)
    📁 logs/
      📄 ScrapingLogsPage.jsx (src/pages/logs/ScrapingLogsPage.jsx)
    📁 repositories/
      📄 RepositoryAnalysisPage.jsx (src/pages/repositories/RepositoryAnalysisPage.jsx)
      📄 RepositoryList.jsx (src/pages/repositories/RepositoryList.jsx)
    📁 vulnerabilities/
      📄 VulnerabilityDetailsPage.jsx (src/pages/vulnerabilities/VulnerabilityDetailsPage.jsx)
      📄 index.js (src/pages/vulnerabilities/index.js)
  📁 services/
    📁 aws/
      📄 auth.js (src/services/aws/auth.js)
      📄 ecr.js (src/services/aws/ecr.js)
    📁 scraping/
      📄 vulnerabilityScraper.js (src/services/scraping/vulnerabilityScraper.js)
  📁 store/
    📄 authStore.js (src/store/authStore.js)
    📄 repositoryStore.js (src/store/repositoryStore.js)
  📁 utils/
    📄 sourceUrls.js (src/utils/sourceUrls.js)
📄 tailwind.config.js (tailwind.config.js)
📄 vite.config.js (vite.config.js)

# Potential Import Statements

import { ComponentName } from 'backend/server';
import { ComponentName } from 'backend/services/scraping/stackoverflowScraper';
import { ComponentName } from 'eslint.config';
import { ComponentName } from 'map-project';
import { ComponentName } from 'postcss.config';
import { ComponentName } from 'src/App';
import { ComponentName } from 'src/components/auth/AWSAuthForm';
import { ComponentName } from 'src/components/auth/ProtectedRoute';
import { ComponentName } from 'src/components/layout/MainLayout';
import { ComponentName } from 'src/components/layout/Navbar';
import { ComponentName } from 'src/components/layout/Sidebar';
import { ComponentName } from 'src/components/repositories/ImageDetailsModal';
import { ComponentName } from 'src/components/repositories/RepositoryAnalysis';
import { ComponentName } from 'src/components/repositories/RepositoryAnalysisPage';
import { ComponentName } from 'src/components/ui/ModalPortal';
import { ComponentName } from 'src/components/ui/alert';
import { ComponentName } from 'src/components/vulnerability/SeverityBadge';
import { ComponentName } from 'src/components/vulnerability/SourceSelector';
import { ComponentName } from 'src/main';
import { ComponentName } from 'src/pages/auth/Login';
import { ComponentName } from 'src/pages/dashboard/Dashboard';
import { ComponentName } from 'src/pages/logs/ScrapingLogsPage';
import { ComponentName } from 'src/pages/repositories/RepositoryAnalysisPage';
import { ComponentName } from 'src/pages/repositories/RepositoryList';
import { ComponentName } from 'src/pages/vulnerabilities/VulnerabilityDetailsPage';
import { ComponentName } from 'src/pages/vulnerabilities/index';
import { ComponentName } from 'src/services/aws/auth';
import { ComponentName } from 'src/services/aws/ecr';
import { ComponentName } from 'src/services/scraping/vulnerabilityScraper';
import { ComponentName } from 'src/store/authStore';
import { ComponentName } from 'src/store/repositoryStore';
import { ComponentName } from 'src/utils/sourceUrls';
import { ComponentName } from 'tailwind.config';
import { ComponentName } from 'vite.config';