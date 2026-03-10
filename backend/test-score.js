import scoringService from './services/scoringService.js';

(async()=>{
  try {
    // call scoreAssessment with dummy data (assuming an existing assessment id)
    const res = await scoringService.scoreAssessment({
      assessment_id: '00000000-0000-0000-0000-000000000000',
      answers: [],
      form_type: 'behavioral',
    });
    console.log('score result', res);
  } catch(e) {
    console.error('error', e);
  }
})();