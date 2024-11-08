// src/pages/repositories/RepositoryAnalysisPage.jsx
import { useParams } from 'react-router-dom';
import RepositoryAnalysis from '../../components/repositories/RepositoryAnalysis';

const RepositoryAnalysisPage = () => {
  const { name } = useParams();
  return <RepositoryAnalysis repositoryName={name} />;
};

export default RepositoryAnalysisPage;
