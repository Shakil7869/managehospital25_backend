const OpenAI = require('openai');
const LabReport = require('../models/LabReport');
const LabTest = require('../models/LabTest');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Report Explanation Service
 * Analyzes lab reports and provides plain language explanations
 */
class AIReportService {

    /**
     * Analyze lab report and highlight abnormalities
     */
    async analyzeReport({ reportId, results, userId }) {
        try {
            // Get report details
            const report = await LabReport.findById(reportId)
                .populate('labTest')
                .populate('patient', 'firstName lastName age gender');

            if (!report) {
                throw new Error('Report not found');
            }

            // Analyze each result
            const analyzedResults = await Promise.all(
                results.map(result => this.analyzeSingleResult(result, report))
            );

            // Generate overall assessment
            const overallAssessment = await this.generateOverallAssessment(
                analyzedResults,
                report
            );

            // Identify critical values
            const criticalValues = this.identifyCriticalValues(analyzedResults);

            // Generate patient education content
            const patientEducation = await this.generatePatientEducation(
                analyzedResults,
                report
            );

            // Calculate risk score
            const riskScore = this.calculateRiskScore(analyzedResults);

            return {
                reportId,
                analyzedResults,
                overallAssessment,
                criticalValues,
                patientEducation,
                riskScore,
                recommendations: await this.generateRecommendations(analyzedResults, report),
                analyzedBy: userId,
                analyzedAt: new Date()
            };

        } catch (error) {
            console.error('AI Report Analysis Error:', error);
            throw new Error('Failed to analyze report');
        }
    }

    /**
     * Analyze a single test result
     */
    async analyzeSingleResult(result, report) {
        const { parameter, value, unit, referenceRange } = result;

        // Determine if value is normal, high, or low
        const status = this.determineResultStatus(value, referenceRange, report.patient);

        // Generate AI explanation
        const explanation = await this.generateResultExplanation(
            parameter,
            value,
            unit,
            status,
            report.patient
        );

        return {
            parameter,
            value,
            unit,
            referenceRange,
            status,
            explanation,
            severity: this.determineSeverity(parameter, value, status),
            clinicalSignificance: await this.getClinicalSignificance(parameter, status)
        };
    }

    /**
     * Determine if a result is normal, high, or low
     */
    determineResultStatus(value, referenceRange, patient) {
        if (!referenceRange || !referenceRange.normal) {
            return 'unknown';
        }

        // Parse numeric value
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            return 'text_result';
        }

        // Get appropriate reference range based on gender/age
        let range = referenceRange.normal;
        if (patient.gender === 'male' && referenceRange.male) {
            range = referenceRange.male;
        } else if (patient.gender === 'female' && referenceRange.female) {
            range = referenceRange.female;
        }

        // Parse range values
        const minValue = parseFloat(range.min);
        const maxValue = parseFloat(range.max);

        if (numericValue < minValue) {
            return 'low';
        } else if (numericValue > maxValue) {
            return 'high';
        } else {
            return 'normal';
        }
    }

    /**
     * Generate AI explanation for a test result
     */
    async generateResultExplanation(parameter, value, unit, status, patient) {
        if (status === 'normal') {
            return `Your ${parameter} level (${value} ${unit}) is within the normal range, which indicates good health.`;
        }

        const prompt = `
      Explain this lab test result in simple, patient-friendly language:
      
      Test: ${parameter}
      Result: ${value} ${unit}
      Status: ${status}
      Patient: ${patient.age}-year-old ${patient.gender}
      
      Provide:
      1. What this test measures
      2. What the ${status} result means
      3. Possible causes (if abnormal)
      4. General implications for health
      
      Keep it under 100 words, reassuring but accurate.
    `;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a medical communication assistant explaining lab results to patients in simple terms."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.3
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            return this.getFallbackExplanation(parameter, status);
        }
    }

    /**
     * Generate overall assessment of all results
     */
    async generateOverallAssessment(analyzedResults, report) {
        const abnormalResults = analyzedResults.filter(r => r.status !== 'normal');

        if (abnormalResults.length === 0) {
            return "All test results are within normal ranges, indicating good health.";
        }

        const prompt = `
      Generate an overall health assessment based on these lab results:
      
      Patient: ${report.patient.age}-year-old ${report.patient.gender}
      
      Abnormal Results:
      ${abnormalResults.map(r => `- ${r.parameter}: ${r.value} (${r.status})`).join('\n')}
      
      Provide a brief, reassuring but honest overall assessment in 2-3 sentences.
    `;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a medical communication assistant providing overall health assessments."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 100,
                temperature: 0.3
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            return `${abnormalResults.length} test result(s) are outside the normal range. Please discuss these findings with your healthcare provider for proper interpretation and next steps.`;
        }
    }

    /**
     * Identify critical values requiring immediate attention
     */
    identifyCriticalValues(analyzedResults) {
        return analyzedResults
            .filter(result => result.severity === 'critical')
            .map(result => ({
                parameter: result.parameter,
                value: result.value,
                concern: result.explanation,
                urgency: 'immediate_attention_required'
            }));
    }

    /**
     * Determine severity of abnormal result
     */
    determineSeverity(parameter, value, status) {
        if (status === 'normal') return 'normal';

        // Define critical value thresholds for common parameters
        const criticalThresholds = {
            'glucose': { high: 400, low: 40 },
            'creatinine': { high: 5.0, low: 0 },
            'hemoglobin': { high: 20, low: 7 },
            'platelets': { high: 1000, low: 50 },
            'potassium': { high: 6.0, low: 2.5 },
            'sodium': { high: 155, low: 125 }
        };

        const numericValue = parseFloat(value);
        const threshold = criticalThresholds[parameter.toLowerCase()];

        if (threshold && !isNaN(numericValue)) {
            if ((status === 'high' && numericValue >= threshold.high) ||
                (status === 'low' && numericValue <= threshold.low)) {
                return 'critical';
            }
        }

        return status === 'normal' ? 'normal' : 'abnormal';
    }

    /**
     * Get clinical significance of parameter
     */
    async getClinicalSignificance(parameter, status) {
        const significance = {
            glucose: {
                high: 'May indicate diabetes or prediabetes',
                low: 'May indicate hypoglycemia'
            },
            cholesterol: {
                high: 'Increased risk of heart disease',
                low: 'Generally not concerning'
            },
            hemoglobin: {
                high: 'May indicate dehydration or blood disorders',
                low: 'May indicate anemia'
            }
        };

        return significance[parameter.toLowerCase()]?.[status] || 'Consult your healthcare provider for interpretation';
    }

    /**
     * Generate patient education content
     */
    async generatePatientEducation(analyzedResults, report) {
        const abnormalResults = analyzedResults.filter(r => r.status !== 'normal');

        if (abnormalResults.length === 0) {
            return "Your lab results are normal. Continue maintaining a healthy lifestyle with regular exercise, balanced diet, and routine checkups.";
        }

        return "Some of your test results are outside the normal range. This doesn't necessarily mean you have a serious condition - many factors can affect test results. Please discuss these findings with your healthcare provider to understand what they mean for your health and what steps, if any, you should take.";
    }

    /**
     * Calculate overall risk score
     */
    calculateRiskScore(analyzedResults) {
        let score = 0;

        analyzedResults.forEach(result => {
            switch (result.severity) {
                case 'critical':
                    score += 3;
                    break;
                case 'abnormal':
                    score += 1;
                    break;
                default:
                    score += 0;
            }
        });

        // Normalize to 0-100 scale
        const maxPossibleScore = analyzedResults.length * 3;
        return Math.round((score / maxPossibleScore) * 100);
    }

    /**
     * Generate recommendations based on results
     */
    async generateRecommendations(analyzedResults, report) {
        const abnormalResults = analyzedResults.filter(r => r.status !== 'normal');

        if (abnormalResults.length === 0) {
            return [
                'Continue regular health checkups',
                'Maintain healthy lifestyle',
                'Follow up as recommended by your doctor'
            ];
        }

        return [
            'Discuss results with your healthcare provider',
            'Follow any treatment recommendations',
            'Schedule follow-up testing if advised',
            'Monitor symptoms and report changes'
        ];
    }

    /**
     * Fallback explanation when AI is not available
     */
    getFallbackExplanation(parameter, status) {
        const fallbacks = {
            high: `Your ${parameter} level is higher than normal. Please consult with your healthcare provider to discuss what this means for your health.`,
            low: `Your ${parameter} level is lower than normal. Please consult with your healthcare provider to discuss what this means for your health.`,
            normal: `Your ${parameter} level is within the normal range.`
        };

        return fallbacks[status] || `Please consult with your healthcare provider about your ${parameter} result.`;
    }
}

module.exports = new AIReportService();