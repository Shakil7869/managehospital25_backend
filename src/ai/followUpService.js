const OpenAI = require('openai');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Patient Follow-Up Engine
 * Generates automated follow-up messages for patients
 */
class AIFollowUpService {

    /**
     * Generate personalized follow-up message
     */
    async generateFollowUp({ patientId, appointmentId, type, userId }) {
        try {
            // Get patient and appointment data
            const patient = await Patient.findOne({ userId: patientId })
                .populate('userId', 'firstName lastName age');

            const appointment = await Appointment.findById(appointmentId)
                .populate('doctor', 'firstName lastName specialization');

            if (!patient || !appointment) {
                throw new Error('Patient or appointment not found');
            }

            // Prepare context for AI
            const context = {
                patientName: patient.userId.fullName,
                patientAge: patient.userId.age,
                appointmentType: appointment.type,
                doctorName: appointment.doctor.fullName,
                specialization: appointment.doctor.specialization,
                diagnosis: appointment.diagnosis,
                treatment: appointment.treatment,
                followUpType: type
            };

            // Generate follow-up message based on type
            let message = '';
            let recommendedActions = [];

            switch (type) {
                case 'post_consultation':
                    message = await this.generatePostConsultationMessage(context);
                    break;
                case 'medication_reminder':
                    message = await this.generateMedicationReminder(context);
                    break;
                case 'surgery_followup':
                    message = await this.generateSurgeryFollowUp(context);
                    break;
                case 'health_checkup':
                    message = await this.generateHealthCheckupReminder(context);
                    break;
                default:
                    message = await this.generateGeneralFollowUp(context);
            }

            // Get recommended actions from AI
            recommendedActions = await this.getRecommendedActions(context, type);

            return {
                message,
                recommendedActions,
                type,
                context: {
                    patientId,
                    appointmentId,
                    generatedBy: userId,
                    generatedAt: new Date()
                }
            };

        } catch (error) {
            console.error('AI Follow-up Service Error:', error);
            throw new Error('Failed to generate follow-up message');
        }
    }

    /**
     * Generate post-consultation follow-up message
     */
    async generatePostConsultationMessage(context) {
        const prompt = `
      Generate a warm, professional follow-up message for a patient after their consultation.
      
      Patient: ${context.patientName} (Age: ${context.patientAge})
      Doctor: Dr. ${context.doctorName} (${context.specialization})
      Consultation Type: ${context.appointmentType}
      
      The message should:
      - Thank the patient for their visit
      - Provide a brief summary of the consultation
      - Remind them about prescribed medications/treatments
      - Encourage them to contact if they have concerns
      - Be compassionate and professional
      
      Keep it under 200 words.
    `;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a healthcare communication assistant creating patient follow-up messages."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            return this.getFallbackMessage('post_consultation', context);
        }
    }

    /**
     * Generate medication reminder message
     */
    async generateMedicationReminder(context) {
        const prompt = `
      Create a gentle medication reminder message for a patient.
      
      Patient: ${context.patientName}
      
      The message should:
      - Remind them about taking their medications as prescribed
      - Emphasize the importance of medication compliance
      - Provide guidance on what to do if they miss a dose
      - Be encouraging and supportive
      
      Keep it under 150 words.
    `;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a healthcare communication assistant creating medication reminder messages."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.6
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            return this.getFallbackMessage('medication_reminder', context);
        }
    }

    /**
     * Get recommended follow-up actions
     */
    async getRecommendedActions(context, type) {
        // Default actions based on type
        const defaultActions = {
            post_consultation: [
                'Schedule follow-up appointment',
                'Take medications as prescribed',
                'Monitor symptoms',
                'Contact if concerns arise'
            ],
            medication_reminder: [
                'Take medication at prescribed times',
                'Set up medication alarms',
                'Consult doctor before stopping medication'
            ],
            surgery_followup: [
                'Follow wound care instructions',
                'Attend all post-op appointments',
                'Report any complications immediately',
                'Gradually resume activities as advised'
            ],
            health_checkup: [
                'Schedule annual health checkup',
                'Update medical history',
                'Discuss any new symptoms',
                'Review current medications'
            ]
        };

        return defaultActions[type] || defaultActions.post_consultation;
    }

    /**
     * Fallback messages when AI is not available
     */
    getFallbackMessage(type, context) {
        const fallbacks = {
            post_consultation: `Dear ${context.patientName},\n\nThank you for visiting Dr. ${context.doctorName} today. Please follow the treatment plan discussed during your consultation. If you have any questions or concerns, don't hesitate to contact our clinic.\n\nTake care!`,

            medication_reminder: `Hi ${context.patientName},\n\nThis is a gentle reminder to take your medications as prescribed. Consistent medication intake is important for your recovery. If you have any questions about your medications, please contact your healthcare provider.\n\nStay healthy!`,

            surgery_followup: `Dear ${context.patientName},\n\nWe hope your recovery is going well. Please follow all post-operative care instructions provided. If you experience any unusual symptoms or concerns, please contact us immediately.\n\nWishing you a speedy recovery!`,

            health_checkup: `Hi ${context.patientName},\n\nIt's time for your regular health checkup! Regular checkups help maintain your health and catch any potential issues early. Please schedule your appointment at your earliest convenience.\n\nStay healthy!`
        };

        return fallbacks[type] || fallbacks.post_consultation;
    }

    /**
     * Generate surgery follow-up message
     */
    async generateSurgeryFollowUp(context) {
        return this.getFallbackMessage('surgery_followup', context);
    }

    /**
     * Generate health checkup reminder
     */
    async generateHealthCheckupReminder(context) {
        return this.getFallbackMessage('health_checkup', context);
    }

    /**
     * Generate general follow-up message
     */
    async generateGeneralFollowUp(context) {
        return this.getFallbackMessage('post_consultation', context);
    }

    /**
     * Schedule automated follow-up messages
     */
    async scheduleFollowUp({ patientId, appointmentId, scheduleType, delay }) {
        // This would integrate with a job scheduler like Bull Queue or node-cron
        // For now, return a placeholder
        return {
            scheduled: true,
            executeAt: new Date(Date.now() + delay),
            type: scheduleType,
            patientId,
            appointmentId
        };
    }
}

module.exports = new AIFollowUpService();