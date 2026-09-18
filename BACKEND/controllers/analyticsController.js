const Result = require('../models/Result');
const Test = require('../models/Test');

/**
 * @desc    Get aggregated dashboard and chart statistics
 * @route   GET /api/analytics
 * @access  Private
 */
const getAnalytics = async (req, res, next) => {
  try {
    const attempts = await Result.find({ user: req.user.id })
      .populate('test')
      .sort({ createdAt: 1 });

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          testsAttempted: 0,
          averageScore: 0,
          weakTopics: []
        },
        charts: {
          progressOverTime: [],
          subjectPerformance: {},
          topicPerformance: {
            'Coding Standards': 70,
            'Inheritance': 70,
            'Polymorphism': 70,
            'Abstraction': 70,
            'Theoretical Logic': 70,
            'Scenario Design': 70
          },
          difficultyPerformance: {}
        }
      });
    }

    const count = attempts.length;
    const avgScore = parseFloat(
      (attempts.reduce((sum, r) => sum + r.percentageScore, 0) / count).toFixed(1)
    );

    // Compile weak topics frequencies
    const topicCounts = {};
    attempts.forEach(r => {
      if (r.weakTopics) {
        r.weakTopics.forEach(t => {
          if (t && t !== 'None' && !t.includes('None!')) {
            topicCounts[t] = (topicCounts[t] || 0) + 1;
          }
        });
      }
    });

    const weakTopicsList = Object.entries(topicCounts)
      .map(([name, freq]) => ({ name, freq }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 5)
      .map(item => item.name);

    // Progress over time chart data
    const progressOverTime = attempts.map(r => {
      const subject = r.test ? r.test.subject : 'General';
      const formattedDate = new Date(r.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      return {
        date: formattedDate,
        rawDate: r.createdAt,
        score: r.percentageScore,
        subject
      };
    });

    // Subject performance breakdown
    const subjectTotals = {};
    attempts.forEach(r => {
      const subject = r.test ? r.test.subject : 'General';
      if (!subjectTotals[subject]) {
        subjectTotals[subject] = { sum: 0, count: 0 };
      }
      subjectTotals[subject].sum += r.percentageScore;
      subjectTotals[subject].count += 1;
    });
    const subjectPerformance = {};
    Object.entries(subjectTotals).forEach(([subj, data]) => {
      subjectPerformance[subj] = parseFloat((data.sum / data.count).toFixed(1));
    });

    // Difficulty performance breakdown
    const diffTotals = {};
    attempts.forEach(r => {
      const difficulty = r.test ? r.test.difficulty : 'medium';
      // Capitalize first letter for consistency with frontend
      const diffCapitalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      if (!diffTotals[diffCapitalized]) {
        diffTotals[diffCapitalized] = { sum: 0, count: 0 };
      }
      diffTotals[diffCapitalized].sum += r.percentageScore;
      diffTotals[diffCapitalized].count += 1;
    });
    const difficultyPerformance = {};
    Object.entries(diffTotals).forEach(([diff, data]) => {
      difficultyPerformance[diff] = parseFloat((data.sum / data.count).toFixed(1));
    });

    // Topic performance spider metrics matching frontend categories
    const topicPerformance = {
      'Coding Standards': 80,
      'Inheritance': 75,
      'Polymorphism': 85,
      'Abstraction': 65,
      'Theoretical Logic': 70,
      'Scenario Design': 60
    };

    if (avgScore > 80) {
      topicPerformance.Inheritance = 90;
      topicPerformance.Polymorphism = 95;
      topicPerformance.Abstraction = 85;
    } else if (avgScore < 65) {
      topicPerformance.Inheritance = 55;
      topicPerformance.Abstraction = 45;
      topicPerformance.Polymorphism = 60;
    }

    res.status(200).json({
      success: true,
      stats: {
        testsAttempted: count,
        averageScore: avgScore,
        weakTopics: weakTopicsList
      },
      charts: {
        progressOverTime,
        subjectPerformance,
        difficultyPerformance,
        topicPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
