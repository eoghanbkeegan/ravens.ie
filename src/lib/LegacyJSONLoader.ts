import * as THREE from 'three'

export class LegacyJSONLoader {
  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry, materials: THREE.Material[]) => void,
    onError?: (err: unknown) => void
  ) {
    fetch(url)
      .then((res) => res.json())
      .then((json: unknown) => {
        const data = json as Record<string, unknown>
        const geometry = this.parse(data)
        const materials = this.parseMaterials(
          (data.materials as Record<string, unknown>[]) || []
        )
        onLoad(geometry, materials)
      })
      .catch((err) => {
        console.error('LegacyJSONLoader error:', err)
        onError?.(err)
      })
  }

  parse(data: Record<string, unknown>): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const vertices = (data.vertices as number[]) || []
    const faces = (data.faces as number[]) || []
    const uvs = ((data.uvs as number[][])?.[0]) || []

    const positions: number[] = []
    const uvsOut: number[] = []
    const indices: number[] = []

    let i = 0
    while (i < faces.length) {
      const type = faces[i++]
      const isQuad = type & 1
      const hasMaterial = (type >> 1) & 1
      const hasFaceUv = (type >> 2) & 1
      const hasFaceVertexUv = (type >> 3) & 1
      const hasFaceNormal = (type >> 4) & 1
      const hasFaceVertexNormal = (type >> 5) & 1

      const a = faces[i++]
      const b = faces[i++]
      const c = faces[i++]
      let d: number | undefined
      if (isQuad) d = faces[i++]

      if (hasMaterial) i++
      if (hasFaceUv) i++

      // suppress unused warnings
      void hasFaceNormal
      void hasFaceVertexNormal

      let uvA = [0, 0], uvB = [0, 0], uvC = [0, 0], uvD = [0, 0]
      if (hasFaceVertexUv) {
        const ia = faces[i++] * 2
        const ib = faces[i++] * 2
        const ic = faces[i++] * 2
        uvA = [uvs[ia], uvs[ia + 1]]
        uvB = [uvs[ib], uvs[ib + 1]]
        uvC = [uvs[ic], uvs[ic + 1]]
        if (isQuad) {
          const id = faces[i++] * 2
          uvD = [uvs[id], uvs[id + 1]]
        }
      }

      if (hasFaceNormal) i++
      if (hasFaceVertexNormal) {
        i += isQuad ? 4 : 3
      }

      const base = positions.length / 3
      positions.push(
        vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2],
        vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2],
        vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2],
      )
      uvsOut.push(...uvA, ...uvB, ...uvC)
      indices.push(base, base + 1, base + 2)

      if (isQuad && d !== undefined) {
        const base2 = positions.length / 3
        positions.push(
          vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2],
          vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2],
          vertices[d * 3], vertices[d * 3 + 1], vertices[d * 3 + 2],
        )
        uvsOut.push(...uvA, ...uvC, ...uvD)
        indices.push(base2, base2 + 1, base2 + 2)
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvsOut, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }

  parseMaterials(materials: Record<string, unknown>[]): THREE.Material[] {
    return materials.map((m) => {
      const colorDiffuse = m.colorDiffuse as number[] | undefined
      return new THREE.MeshStandardMaterial({
        color: colorDiffuse
          ? new THREE.Color(colorDiffuse[0], colorDiffuse[1], colorDiffuse[2])
          : new THREE.Color(0xffffff),
        side: THREE.DoubleSide,
      })
    })
  }
}