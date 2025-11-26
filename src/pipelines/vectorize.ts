export async function vectorize(
    input: SVGElement | string
): Promise<string> {
    if (typeof input === 'string') return input
    return new XMLSerializer().serializeToString(input)
}
