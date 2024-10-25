import { useState, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';
import * as use from '@tensorflow-models/universal-sentence-encoder';

export const useSafetyAnalysis = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [safetyScore, setSafetyScore] = useState(null);
  
  const toxicityModelRef = useRef(null);
  const useModelRef = useRef(null);

  // Keywords related to safety information
  const safetyKeywords = [
    'safe', 'secure', 'police', 'emergency', 'hospital', 'clinic',
    'well-lit', 'neighborhood', 'community', 'patrol', 'security',
    'surveillance', 'camera', 'guard', 'protection', 'crime-free',
    'peaceful', 'quiet', 'residential', 'family-friendly'
  ];

  // Keywords indicating potential safety issues
  const dangerKeywords = [
    'crime', 'danger', 'unsafe', 'robbery', 'assault', 'theft',
    'shooting', 'violent', 'gang', 'drug', 'suspicious', 'emergency',
    'police', 'incident', 'warning', 'avoid', 'dangerous'
  ];

  const initializeModels = useCallback(async () => {
    try {
      if (!toxicityModelRef.current) {
        toxicityModelRef.current = await toxicity.load(0.7);
      }
      if (!useModelRef.current) {
        useModelRef.current = await use.load();
      }
    } catch (err) {
      throw new Error(`Failed to load ML models: ${err.message}`);
    }
  }, []);

  const analyzeText = async (text) => {
    if (!useModelRef.current) {
      await initializeModels();
    }
    
    const embeddings = await useModelRef.current.embed([text]);
    const textVector = await embeddings.array();
    return textVector[0];
  };

  const containsSafetyInformation = (text) => {
    const lowercaseText = text.toLowerCase();
    return safetyKeywords.some(keyword => lowercaseText.includes(keyword)) ||
           dangerKeywords.some(keyword => lowercaseText.includes(keyword));
  };

  const calculateSafetyScore = async (tweets) => {
    if (!toxicityModelRef.current) {
      await initializeModels();
    }

    let safetyMetrics = {
      totalSafetyTweets: 0,
      positiveSentiment: 0,
      negativeSentiment: 0,
      safetyKeywordCount: 0,
      dangerKeywordCount: 0
    };

    const safetyTweets = tweets.filter(tweet => containsSafetyInformation(tweet.text));
    
    for (const tweet of safetyTweets) {
      const lowercaseText = tweet.text.toLowerCase();
      
      // Count keywords
      safetyKeywords.forEach(keyword => {
        if (lowercaseText.includes(keyword)) safetyMetrics.safetyKeywordCount++;
      });
      dangerKeywords.forEach(keyword => {
        if (lowercaseText.includes(keyword)) safetyMetrics.dangerKeywordCount++;
      });

      try {
        // Analyze toxicity
        const predictions = await toxicityModelRef.current.classify(tweet.text);
        const isToxic = predictions[0].results[0].match;
        
        if (!isToxic) {
          safetyMetrics.positiveSentiment++;
        } else {
          safetyMetrics.negativeSentiment++;
        }
      } catch (err) {
        console.error('Error analyzing tweet toxicity:', err);
      }
    }

    safetyMetrics.totalSafetyTweets = safetyTweets.length;

    // Avoid division by zero
    const totalSentiment = safetyMetrics.totalSafetyTweets || 1;
    const totalKeywords = (safetyMetrics.safetyKeywordCount + safetyMetrics.dangerKeywordCount) || 1;

    // Calculate final safety score (0-100)
    const safetyScore = Math.round(
      (
        (safetyMetrics.positiveSentiment * 100 / totalSentiment) +
        (safetyMetrics.safetyKeywordCount * 100 / totalKeywords)
      ) / 2
    );

    return {
      score: safetyScore,
      metrics: safetyMetrics,
      relevantTweets: safetyTweets
    };
  };

  const fetchAndAnalyze = async (url, options = {}) => {
    setLoading(true);
    
    try {
      // Initialize models first
      await initializeModels();
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Analyze tweets for safety information
      const analysis = await calculateSafetyScore(result.results);
      
      setData(analysis.relevantTweets);
      setSafetyScore(analysis);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
      setSafetyScore(null);
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, safetyScore, fetchAndAnalyze };
};