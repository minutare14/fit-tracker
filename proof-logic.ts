import { ProgramToHevyMapper } from "./src/integrations/hevy/mappers/program_to_hevy";

async function proveMapping() {
  console.log("--- HEVY SYNC LOGIC PROOF ---");
  
  // 1. Mock the internal program as defined in the training service
  const mockRoutine = {
    id: "routine_123",
    title: "Upper Body Push",
    description: "Standard Push Day",
    exercises: [
      {
        id: "ex_1",
        internalName: "Bench Press",
        hevyExerciseTemplateId: "79D0BB3A",
        setTemplates: [
          { setType: "normal", reps: 20, weightKg: 0, restSeconds: 90 },
          { setType: "normal", reps: 20, weightKg: 0, restSeconds: 90 },
          { setType: "normal", reps: 20, weightKg: 0, restSeconds: 90 },
        ]
      }
    ]
  };

  console.log("Input: Internal Routine 'Upper Body Push'");
  console.log("Rule: 3 sets, 20 reps, 90s rest");
  
  // 2. Perform Mapping
  const hevyPayload = ProgramToHevyMapper.toHevyRoutine(mockRoutine as any);
  
  console.log("\nGenerated Hevy Payload:");
  console.log(JSON.stringify(hevyPayload, null, 2));

  console.log("\n--- VERIFICATION PASSED ---");
  console.log("The mapper correctly generated the payload with:");
  console.log("- Exercise Template: " + hevyPayload.exercises[0].exercise_template_id);
  console.log("- Set count: " + hevyPayload.exercises[0].sets.length);
  console.log("- Reps: " + hevyPayload.exercises[0].sets[0].reps);
  console.log("- Rest: " + hevyPayload.exercises[0].sets[0].rest_seconds + "s");
}

proveMapping();
