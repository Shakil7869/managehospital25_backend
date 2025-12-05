/**
 * AI Voice-to-Report
 * Converts doctor speech to structured report text
 */
class AIVoiceService {
    async convertVoiceToReport({ audioData, appointmentId, language, userId }) {
        // AI implementation for voice-to-text conversion
        return {
            transcription: 'Voice converted to text',
            structuredData: {}
        };
    }
}

module.exports = new AIVoiceService();