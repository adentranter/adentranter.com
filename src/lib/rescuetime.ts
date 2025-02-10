/**
 * Fetches and processes daily productivity statistics from RescueTime API
 * @returns {Promise<Object|null>} Processed productivity stats or null if error occurs
 */
export async function getRescueTimeStats() {
  try {
    console.log('Fetching RescueTime stats...');
    
    // Validate API key
    if (!process.env.RESCUETIME_API_KEY) {
      throw new Error('RescueTime API key not found in environment variables');
    }

    const response = await fetch(
      `https://www.rescuetime.com/anapi/daily_summary_feed?key=${process.env.RESCUETIME_API_KEY}&format=json`
    );

    if (!response.ok) {
      console.log(response);
      throw new Error(`RescueTime API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid or empty response from RescueTime API');
    }


    // Get today's data
    const today = data[0] || {};
    
    // Get last 7 days of data
    const lastSevenDays = data.slice(0, 7);
    
    const weeklyStats = lastSevenDays.reduce((stats, day) => {
      return {
        totalHours: stats.totalHours + (day.total_hours || 0),
        productivitySum: stats.productivitySum + (day.productivity_pulse || 0)
      };
    }, { totalHours: 0, productivitySum: 0 });

    return {
      today: {
        totalHours: today.total_hours || 0,
        productiveHours: today.productive_hours || 0,
        productivityPulse: today.productivity_pulse || 0,
        veryProductiveHours: today.very_productive_hours || 0,
        topCategories: today.top_categories || [],
        // Additional useful metrics
        distractingHours: today.distracting_hours || 0,
        neutralHours: today.neutral_hours || 0,
        allProductiveHours: (today.very_productive_hours || 0) + (today.productive_hours || 0)
      },
      week: {
        totalHours: weeklyStats.totalHours,
        averageProductivity: weeklyStats.productivitySum / 7,
        dailyAverageHours: weeklyStats.totalHours / 7
      }
    };
  } catch (error) {
    // Type guard to check if error is an Error object
    if (error instanceof Error) {
      console.error('RescueTime error:', error.message);
    } else {
      console.error('RescueTime error:', error);
    }
    return null;
  }
}