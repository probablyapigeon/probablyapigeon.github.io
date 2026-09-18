# XC 0.1 — a compact visual-state sketch.
# Names such as curiosity are model variables, not validated psychology.

model MemoryBloom {
    seed 24014

    state point: vector[2] = [0.0, 0.0]
    state entropy: float = 0.38
    state curiosity_proxy: float = 0.72
    memory trail: vector[64] decay=0.94

    operator Drift(x: vector[2]) -> vector[2] {
        return rotate(x, curiosity_proxy * 0.2)
    }

    operator Perturb(x: vector[2]) -> vector[2] {
        return x + noise(seed, entropy)
    }

    pipeline bloom {
        Drift -> Perturb
    }

    metric radius = norm(point)
    trace { point, trail, radius }
}
