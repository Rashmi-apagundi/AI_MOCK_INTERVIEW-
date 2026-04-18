import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
} from '../../services/historyService.js';
import InterviewCard from '../../components/InterviewCard';
import { MdDeleteSweep } from 'react-icons/md';
import { BsClipboardData } from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function HistoryPage() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  const ITEMS_PER_PAGE = 8;

  // Load paginated history
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await getHistory(page, ITEMS_PER_PAGE);
        setInterviews(data.interviews || []);
        setTotalPages(data.totalPages || 1);
        setTotalEntries(data.total || 0);
      } catch (error) {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [page]);

  // Delete single interview
  const handleDelete = async (interviewId) => {
    try {
      await deleteHistoryItem(interviewId);
      setInterviews((prev) => prev.filter((i) => i._id !== interviewId));
      setTotalEntries((prev) => prev - 1);
      toast.success('Interview deleted');
    } catch (error) {
      toast.error('Failed to delete interview');
    }
  };

  // Clear all history
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL interview history? This cannot be undone.')) {
      return;
    }
    try {
      await clearHistory();
      setInterviews([]);
      setTotalEntries(0);
      setPage(1);
      toast.success('All history cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  // Navigate based on status
  const handleCardClick = (interview) => {
    if (interview.status === 'completed') {
      navigate(`/feedback/${interview._id}`);
    } else {
      navigate(`/interview/${interview._id}`);
    }
  };

  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header-row">
          <div className="history-header-left">
            <h1 className="history-heading">Interview History</h1>
            <span className="history-count-badge">
              {totalEntries} interview{totalEntries !== 1 ? 's' : ''}
            </span>
          </div>
          {interviews.length > 0 && (
            <button className="history-clear-btn" onClick={handleClearAll}>
              <MdDeleteSweep className="history-clear-icon" />
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="history-loading-state">
            <div className="spinner-border spinner-border-sm" role="status" />
            <p className="history-loading-text">Loading history...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="history-empty-state">
            <BsClipboardData className="history-empty-icon" />
            <h3 className="history-empty-heading">No interviews yet</h3>
            <p className="history-empty-desc">
              Your completed interviews will appear here.
            </p>
            <button
              className="history-start-btn"
              onClick={() => navigate('/setup')}
            >
              Start Your First Interview
            </button>
          </div>
        ) : (
          <>
            <div className="history-grid">
              {interviews.map((interview) => (
                <InterviewCard
                  key={interview._id}
                  interview={interview}
                  onClick={() => handleCardClick(interview)}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="history-pagination">
                <button
                  className={`history-page-btn ${page === 1 ? 'history-page-btn-disabled' : ''}`}
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="history-page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className={`history-page-btn ${page === totalPages ? 'history-page-btn-disabled' : ''}`}
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
