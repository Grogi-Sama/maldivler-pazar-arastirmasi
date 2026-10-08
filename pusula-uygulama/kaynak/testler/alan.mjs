const {demoState, normalize} = await import("./demo.mjs");
const st = normalize(demoState()); st.auto.on = true; st.auto.intros = true;
for (const l of st.leads.filter(l => l.status === "new").slice(0, 2)) l.verified = true;
process.stdout.write(JSON.stringify(st));
