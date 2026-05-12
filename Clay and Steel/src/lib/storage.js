export function defaultState() {
  return {
    onboarded: false,
    settings: {
      split: 'ppl',
      hybridSequence: ['Push', 'Pull', 'Legs'],
      weightMethod: 'manual',
    },
    exerciseOrm: {},
    profile: {
      name: '',
      age: '',
      height: '',
      sex: '',
    },
    measurements: {
      weight: '',
      bodyFat: '',
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: '',
    },
    oneRepMax: {
      benchPress: '',
      squat: '',
      deadlift: '',
      overheadPress: '',
      barbellRow: '',
      pullUp: '',
    },
    templates: {},
    rotation: { pointer: 0 },
    session: null,
    history: [],
  }
}
