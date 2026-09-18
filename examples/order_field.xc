# XC 0.1 — operator order is part of the model.
# The portfolio's browser renderer implements this study in JavaScript.

model OrderField {
    seed 17701

    state z: vector[2] = [0.12, 0.34]
    memory trace: vector[32] decay=0.92

    operator F(x: vector[2]) -> vector[2] {
        return rotate(x, 0.42)
    }

    operator V(x: vector[2]) -> vector[2] {
        return tanh(x + [0.18, -0.08])
    }

    pipeline FV {
        F -> V
    }

    pipeline VF {
        V -> F
    }

    metric order_effect = norm(FV(z) - VF(z))

    trace {
        z
        trace
        order_effect
    }
}
