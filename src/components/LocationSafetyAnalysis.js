'use client'

import { useState, useEffect } from 'react';
import { useSafetyAnalysis } from '../app/hooks/useSafetyAnalysis';

export default function LocationSafetyAnalysis() {
  const [location, setLocation] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data: safetyTweets,
    error,
    loading,
    safetyScore,
    fetchAndAnalyze
  } = useSafetyAnalysis();

  useEffect(() => {
    const initTF = async () => {
      try {
        await import('@tensorflow/tfjs');
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize TensorFlow:', err);
      }
    };
    
    initTF();
  }, []);

  const handleAnalyze = async () => {
    if (!location.trim() || !isInitialized) return;

    const url = `https://twitter154.p.rapidapi.com/search/search?query=${encodeURIComponent(location)}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.NEXT_PUBLIC_TWITTER_RAPID_API_KEY,
        'X-RapidAPI-Host': 'twitter154.p.rapidapi.com'
      }
    };

    try {
      await fetchAndAnalyze(url, options);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location name..."
            className="flex-1 p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !location.trim() || !isInitialized}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 
                     disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">↻</span> Analyzing...
              </span>
            ) : (
              'Analyze Safety'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {safetyScore && (
        <div className="mt-6 p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Safety Analysis Results</h2>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl">Safety Score: </span>
              <span className={`text-3xl font-bold ${getSafetyScoreColor(safetyScore.score)}`}>
                {safetyScore.score}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total Relevant Tweets</p>
                <p className="text-xl font-semibold">{safetyScore.metrics.totalSafetyTweets}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Sentiment Analysis</p>
                <div className="flex gap-4">
                  <p className="text-green-600">
                    +{safetyScore.metrics.positiveSentiment}
                  </p>
                  <p className="text-red-600">
                    -{safetyScore.metrics.negativeSentiment}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {safetyTweets && safetyTweets.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Relevant Tweets</h3>
          <div className="space-y-4">
            {safetyTweets.map((tweet) => (
              <div 
                key={tweet.id} 
                className="p-4 bg-white rounded shadow border-l-4 border-blue-500"
              >
                <p className="text-gray-700">{tweet.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}