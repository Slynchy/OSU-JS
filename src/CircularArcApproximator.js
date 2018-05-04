class CircularArcApproximator {
	static LengthSquared(a) {
		return Math.pow(a.x, 2) + Math.pow(a.y, 2);
	}

	static SubtractTwoVectors(a, b) {
		return {
			x: a.x - b.x,
			y: a.y - b.y
		};
	}

	static AddTwoVectors(a, b) {
		return {
			x: a.x + b.x,
			y: a.y + b.y
		};
	}

	static MultiplyVectorWithScalar(vec, scalar) {}

	static CreateArc(pa, pb, pc, tolerance) {
		let a, b, c;

		//if(!(a instanceof Vector)){
		a = new Vector(pa.x, pa.y);
		b = new Vector(pb.x, pb.y);
		c = new Vector(pc.x, pc.y);
		// } else {
		// 	a = pa;
		// 	b = pb;
		// 	c = pc;
		// }

		let aSq = Math.pow(b.sub(c).distance(new Vector(0, 0)), 2); //CircularArcApproximator.LengthSquared(CircularArcApproximator.SubtractTwoVectors(b,c));
		let bSq = Math.pow(a.sub(c).distance(new Vector(0, 0)), 2); //CircularArcApproximator.LengthSquared(CircularArcApproximator.SubtractTwoVectors(a,c));
		let cSq = Math.pow(a.sub(b).distance(new Vector(0, 0)), 2); //CircularArcApproximator.LengthSquared(CircularArcApproximator.SubtractTwoVectors(a,b));

		let s = aSq * (bSq + cSq - aSq);
		let t = bSq * (aSq + cSq - bSq);
		let u = cSq * (aSq + bSq - cSq);

		let sum = s + t + u;

		// let centre = (
		// 	(a.mult(s)) +
		// 	(b.mult(t)) +
		// 	(c.mult(u))
		// ) / sum;
		let centre = a
			.mult(s)
			.add(b.mult(t))
			.add(c.mult(u))
			.div(sum);
		let dA = a.sub(centre);
		let dC = c.sub(centre);

		let r = dA.distance(new Vector(0, 0));

		let thetaStart = Math.atan2(dA.y, dA.x);
		let thetaEnd = Math.atan2(dC.y, dC.x);

		while (thetaEnd < thetaStart) thetaEnd += 2 * Math.PI;

		let dir = 1;
		let thetaRange = thetaEnd - thetaStart;

		// Decide in which direction to draw the circle, depending on which side of
		// AC B lies.
		let orthoAtoC = c.sub(a);
		orthoAtoC = new Vector(orthoAtoC.y, -orthoAtoC.x);
		if (orthoAtoC.dot(b.sub(a)) < 0) {
			dir = -dir;
			thetaRange = 2 * Math.PI - thetaRange;
		}

		// We select the amount of points for the approximation by requiring the discrete curvature
		// to be smaller than the provided tolerance. The exact angle required to meet the tolerance
		// is: 2 * Math.Acos(1 - TOLERANCE / r)
		// The special case is required for extremely short sliders where the radius is smaller than
		// the tolerance. This is a pathological rather than a realistic case.
		let amountPoints =
			2 * r <= tolerance
				? 2
				: Math.max(2, Math.ceil(thetaRange / (2 * Math.acos(1 - tolerance / r))));

		let output = []; //new List<Vector2>(amountPoints);

		for (let i = 0; i < amountPoints; ++i) {
			let fract = i / (amountPoints - 1);
			let theta = thetaStart + dir * fract * thetaRange;
			let o = new Vector(Math.cos(theta), Math.sin(theta)).mult(r);
			output.push(centre.add(o));
		}

		return output;
	}
}

module.exports = CircularArcApproximator;
