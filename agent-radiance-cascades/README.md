# Agent Radiance Cascades

Verified upstream example source for the Executive Lead Control landing page.

- Source: [vgpu examples](https://vgpu.sh)
- Example: `agent-radiance-cascades`
- Revision: `6fa27bb458ffc3f498727090f09dce3fe5faabb43689fd669d633a2a23dc36bb`
- Aggregate SHA-256: `a2e8ab7c626cd795e2891e00427a92513337821af4c3787a9708f8ec2ca9afe4`

Each of the 11 source files was retrieved from the pinned revision with `vgpu examples cat`; the CLI response size and SHA-256 were checked against the manifest before writing. The CLI's atomic `examples pull` writer reports safe destination storage as unsupported on Windows, so the verified per-file retrieval path was used here.

These files preserve the example as published. The application adapter is in `src/lib/radiance-cascades/`: it uses VGPU's Vite WGSL resolver, fixes the view to final lighting, removes the example's lil-gui development panel, caps work for a landing-page hero, pauses work offscreen, and tears down scene/GPU resources on unmount. The original animation and shader calculations remain intact.
