import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { HelpCircle, X, BookOpen, Video, FileText, ExternalLink, ChevronRight } from 'lucide-react';

/**
 * Contextual Help System
 * Context-aware help panel with tutorials, documentation, and tooltips
 *
 * Features:
 * - Context-sensitive help content
 * - Interactive tutorials/walkthroughs
 * - Search help articles
 * - Video tutorials
 * - Keyboard shortcuts reference
 * - Inline help tooltips
 */

// Help content database
const helpContent = {
  // Dashboard help
  dashboard: {
    title: 'Dashboard Overview',
    description: 'Learn how to navigate and use the dashboard effectively',
    articles: [
      {
        id: 'dashboard-intro',
        title: 'Getting Started with the Dashboard',
        type: 'article',
        icon: <BookOpen className="w-4 h-4" />,
        content: `
          <h3>Welcome to the Clinical Review Scheduler</h3>
          <p>The dashboard provides an overview of all schedules, employees, and entities.</p>

          <h4>Key Features:</h4>
          <ul>
            <li><strong>Schedule List</strong> - View and manage all scheduling periods</li>
            <li><strong>Employee Overview</strong> - See all team members and their skills</li>
            <li><strong>Workload Analytics</strong> - Track workload distribution</li>
            <li><strong>Quick Actions</strong> - Create new schedules, assign tasks</li>
          </ul>

          <h4>Navigation:</h4>
          <ul>
            <li>Use <kbd>Cmd+K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows) to open the command palette</li>
            <li>Click on any schedule to view details</li>
            <li>Use the sidebar to switch between views</li>
          </ul>
        `,
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        type: 'reference',
        icon: <FileText className="w-4 h-4" />,
        content: `
          <h3>Keyboard Shortcuts</h3>
          <table>
            <tr><td><kbd>Cmd/Ctrl + K</kbd></td><td>Open Command Palette</td></tr>
            <tr><td><kbd>Cmd/Ctrl + S</kbd></td><td>Save Schedule</td></tr>
            <tr><td><kbd>Cmd/Ctrl + N</kbd></td><td>New Schedule</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Close Dialog/Panel</td></tr>
            <tr><td><kbd>?</kbd></td><td>Show This Help</td></tr>
          </table>
        `,
      },
    ],
    tutorials: [
      {
        id: 'first-schedule',
        title: 'Creating Your First Schedule',
        duration: '3 min',
        steps: [
          'Click "Create Schedule" button',
          'Enter schedule name and date range',
          'Add employees to the schedule',
          'Assign DARs and entities',
          'Review and save',
        ],
      },
    ],
  },

  // Schedule editing help
  schedule: {
    title: 'Schedule Management',
    description: 'Learn how to create and manage schedules',
    articles: [
      {
        id: 'schedule-basics',
        title: 'Schedule Basics',
        type: 'article',
        icon: <BookOpen className="w-4 h-4" />,
        content: `
          <h3>Understanding Schedules</h3>
          <p>Schedules organize employee assignments for specific time periods.</p>

          <h4>Assignment Types:</h4>
          <ul>
            <li><strong>DARs</strong> - Daily Activity Records (requires DAR skill)</li>
            <li><strong>CPOE</strong> - Computerized Physician Order Entry (requires CPOE skill)</li>
            <li><strong>New Incoming</strong> - Training on new entities</li>
            <li><strong>Cross-Training</strong> - Additional entity training</li>
            <li><strong>Special Projects</strong> - One-off assignments</li>
          </ul>

          <h4>Best Practices:</h4>
          <ul>
            <li>Balance workload across team members</li>
            <li>Respect skill requirements (DAR, CPOE, etc.)</li>
            <li>Rotate entity assignments for cross-training</li>
            <li>Use the Smart Suggestions for optimal assignments</li>
          </ul>
        `,
      },
      {
        id: 'smart-suggestions',
        title: 'Using Smart Suggestions',
        type: 'article',
        icon: <BookOpen className="w-4 h-4" />,
        content: `
          <h3>AI-Powered Smart Suggestions</h3>
          <p>The system analyzes multiple factors to recommend the best employee for each assignment:</p>

          <h4>Ranking Factors:</h4>
          <ul>
            <li><strong>Skills Match</strong> - Does the employee have required skills?</li>
            <li><strong>Workload Balance</strong> - Is the employee under/over-utilized?</li>
            <li><strong>Rotation Freshness</strong> - When did they last have this entity?</li>
            <li><strong>Conflict Detection</strong> - Are they already assigned to this?</li>
          </ul>

          <h4>How to Use:</h4>
          <ol>
            <li>Click on an empty assignment cell</li>
            <li>View the suggested employees (top to bottom)</li>
            <li>Click "Assign" on your preferred suggestion</li>
            <li>Provide feedback (thumbs up/down) to improve future suggestions</li>
          </ol>
        `,
      },
      {
        id: 'conflict-resolver',
        title: 'Auto-Resolving Conflicts',
        type: 'article',
        icon: <BookOpen className="w-4 h-4" />,
        content: `
          <h3>Conflict Auto-Resolver</h3>
          <p>When conflicts are detected, the system can automatically generate fixes.</p>

          <h4>Conflict Types:</h4>
          <ul>
            <li><strong>Skill Mismatch</strong> - Employee lacks required skill</li>
            <li><strong>Workload Imbalance</strong> - Employee is overloaded</li>
            <li><strong>Double Assignment</strong> - Same entity assigned twice</li>
          </ul>

          <h4>Using Auto-Resolver:</h4>
          <ol>
            <li>Conflicts appear automatically when detected</li>
            <li>Review suggested fixes (ranked by confidence)</li>
            <li>Click "Apply This Fix" for individual conflicts</li>
            <li>Or click "Apply All Fixes" for bulk resolution</li>
          </ol>
        `,
      },
    ],
    tutorials: [
      {
        id: 'assign-dar',
        title: 'Assigning DARs',
        duration: '2 min',
        steps: [
          'Find the DAR column for your employee',
          'Click the empty cell',
          'Select an employee from smart suggestions',
          'Or manually drag an employee name',
          'Verify the assignment is saved',
        ],
      },
    ],
  },

  // Analytics help
  analytics: {
    title: 'Analytics & Reports',
    description: 'Understanding workload analytics and reports',
    articles: [
      {
        id: 'workload-heatmap',
        title: 'Reading the Workload Heat Map',
        type: 'article',
        icon: <BookOpen className="w-4 h-4" />,
        content: `
          <h3>Workload Heat Map</h3>
          <p>Visual representation of workload distribution over time.</p>

          <h4>Color Coding:</h4>
          <ul>
            <li><span style="color: #fff; background: #D1D5DB; padding: 2px 8px; border-radius: 4px;">White/Gray</span> - No assignments</li>
            <li><span style="color: #fff; background: #86EFAC; padding: 2px 8px; border-radius: 4px;">Light Green</span> - Low workload (50-70% of average)</li>
            <li><span style="color: #fff; background: #4ADE80; padding: 2px 8px; border-radius: 4px;">Green</span> - Balanced (90-110% of average)</li>
            <li><span style="color: #fff; background: #FB923C; padding: 2px 8px; border-radius: 4px;">Orange</span> - High (110-130% of average)</li>
            <li><span style="color: #fff; background: #EF4444; padding: 2px 8px; border-radius: 4px;">Red</span> - Overloaded (>130% of average)</li>
          </ul>

          <h4>How to Use:</h4>
          <ul>
            <li>Hover over cells to see detailed breakdown</li>
            <li>Click cells to drill down into assignments</li>
            <li>Look for red cells to identify burnout risks</li>
            <li>Use stats (avg, min, max) to understand overall balance</li>
          </ul>
        `,
      },
    ],
  },
};

const ContextualHelp = ({ context = 'dashboard', isOpen, onClose }) => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentContext = helpContent[context] || helpContent.dashboard;

  // Filter articles by search query
  const filteredArticles = searchQuery
    ? currentContext.articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentContext.articles;

  // Auto-select first article when context changes
  useEffect(() => {
    if (currentContext.articles.length > 0) {
      setSelectedArticle(currentContext.articles[0]);
    }
  }, [context]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-20 bottom-4 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-soft-xl border border-slate-200 dark:border-slate-700 flex flex-col animate-slideInRight z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-thr-blue-600" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Help & Support
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close help"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Context Title */}
      <div className="p-4 bg-thr-blue-50 dark:bg-thr-blue-900/20 border-b border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
          {currentContext.title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {currentContext.description}
        </p>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help articles..."
          className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-thr-blue-500"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Article List */}
        <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          {/* Articles */}
          <div className="p-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
              Articles
            </div>
            {filteredArticles.map(article => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors mb-1 ${
                  selectedArticle?.id === article.id
                    ? 'bg-thr-blue-100 dark:bg-thr-blue-900/30 text-thr-blue-700 dark:text-thr-blue-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {article.icon}
                  <span className="text-sm font-medium">{article.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Tutorials */}
          {currentContext.tutorials && currentContext.tutorials.length > 0 && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                Tutorials
              </div>
              {currentContext.tutorials.map(tutorial => (
                <button
                  key={tutorial.id}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mb-1 text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">{tutorial.title}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 ml-6">
                    {tutorial.duration}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedArticle ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                className="help-content"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                Select an article to view its content
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <a
          href="https://docs.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-thr-blue-600 hover:text-thr-blue-700 font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          View Full Documentation
        </a>
      </div>
    </div>
  );
};

ContextualHelp.propTypes = {
  context: PropTypes.oneOf(['dashboard', 'schedule', 'analytics']),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ContextualHelp;
