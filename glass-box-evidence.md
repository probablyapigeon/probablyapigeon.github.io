# Glass-box agents: evidence and boundaries

Reviewed September 18, 2026. This note supports the portfolio's glass-box section.
The review covered public source snapshots, not every historical branch or private implementation.

## Verdict

XEMBRA supports the description **glass-box control layer**. The supplied claim
that it completely solves interpretation, semantic grounding, and hallucination
is not supported. Inspectable variables do not by themselves establish a mind,
validated emotions, faithful prose, safety, or moral status.

## Source map

- [Supported fullxembra engine](https://github.com/probablyapigeon/fullxembra/blob/91af1a5e4cf2ae1ca4f554d4001736146a36c469/xembra.py):
  `XembraState`, `_update_state`, `talk`, `_respond`, and `handle_command` show
  explicit rules, template responses, persisted state, and inspectability commands.
  Entropy is keyword count divided by 12. Only mood, curiosity, and coherence
  have before/after entries in the latest trace. The trace is overwritten;
  memory and goals retain at most 50 and 10 items respectively.
- [Supported runtime boundary](https://github.com/probablyapigeon/fullxembra/blob/91af1a5e4cf2ae1ca4f554d4001736146a36c469/README.md):
  the supported engine is `xembra.py`; older model wrappers are experiments.
  `app.py` and `main.py` both import this engine. An LLM is not used on this path.
- [Older emotional governor](https://github.com/probablyapigeon/fluffy-xembra/blob/6b8190996ce4b8fb1cb3d5581cb5e8106b717e03/modules/emotional_governor.py)
  uses word-triggered mood increments and clamps. Neighboring modules implement
  personality drift, learning, identity, dreams, world state, and timelines.
  Their presence supports modular inspectability, not the quoted eigenvalue mapping.
- [Narrative generator](https://github.com/probablyapigeon/fluffy-xembra/blob/6b8190996ce4b8fb1cb3d5581cb5e8106b717e03/modules/xembra_narrative.py)
  and [update step](https://github.com/probablyapigeon/fluffy-xembra/blob/6b8190996ce4b8fb1cb3d5581cb5e8106b717e03/modules/xembra_update.py)
  share `state.rng`. Extra narrative generation advances that stream and can
  change later numeric dynamics. This contradicts an unconditional assertion
  that presentation cannot influence internal state.
- [Experimental LLM path](https://github.com/probablyapigeon/fullxembra/blob/91af1a5e4cf2ae1ca4f554d4001736146a36c469/xembra_core.py)
  calls `model.generate`. State-conditioned prompts are not proof of faithful
  explanations. No general hallucination-elimination result follows.
- [LonkWorld source](https://github.com/probablyapigeon/TheLonks/blob/c6a317c81dda41e6aab280eca371d800d92db07f/LonkWorld.xc#L454)
  defines explicit state, action scores, argmax selection, and host-supplied
  random noise. Its executable procedures provide simulated learning and social
  dynamics. Reproducibility depends on the source, inputs, and saved random state.
- [XC scope](https://github.com/probablyapigeon/xembra-xc/blob/15052d2a4bfde4f3fe28612d2860b1fec4606bc0/README.md)
  distinguishes the small public interpreter from the broader language design
  and explicitly disclaims unvalidated psychological and physical interpretations.

Additional inspected repositories: `xembra` at
`c06846e161be1ed98bcffe67872b7c51eeaf3195`, `XEMBRA_PROTOCOL` at
`f30bc3bf9913f41144d8123eaea18c06e1e3a86d`, and the main snapshot of
`xembrabeforecrash`. No matching `KernelState` class was found in the inspected
Python sources. Eigenvalue calculations in `fullxembra`'s mathematical checks
are not a demonstrated eigenvalue-to-emotion mechanism in the supported engine.

## Fresh verification

- Passed a direct fullxembra reproduction: a first question changes curiosity
  from 0.5 to 0.545; checked trace field coverage, 50-memory / 10-goal retention,
  and persistence/reload of the latest trace using a temporary state file.
- Passed a narrative intervention: two fluffy-xembra states with seed 42 match
  after one update; inserting an extra `compose_narrative` call into one path
  changes its subsequent numeric trajectory.
- Passed three existing TheLonks tests (31.993 seconds):
  `python -m unittest test_lonkworld.LonkTests.test_save_roundtrip_and_exact_continuation test_xc_port -v`.
  These cover save/resume, behavior against a historical reference including
  the random stream, and an XC source edit changing the learning algorithm.
- Checked edited HTML nesting, unique IDs, internal anchors, and git whitespace.
  These are structural checks, not a rendered-browser or accessibility audit.

## Symbiosis as a research proposal

The preference for negotiated cooperation over enforced obedience is a design
commitment, not an empirical consequence of transparent code. The section uses
alignment-as-control in that specific sense; compatibility and harm prevention
remain compatible with symbiosis. Proposed refusal, negotiation, memory controls,
and exit criteria are research directions, not claims of implemented guarantees.

Evaluate the proposal by testing goal revision, consent boundaries, disagreement,
exit, explanation fidelity, and effects on users and third parties. Transparency
can enable surveillance and manipulation as well as accountability. A useful
symbiosis design must specify who may inspect or change what, under which terms.
