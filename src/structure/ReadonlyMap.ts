/**
 * A readonly map.
 */
export class ReadonlyMap <K, V>
{
	
	/** The private map. */
	private readonly __map: Map<K, V>
	
	/** Get the size of the read only map. */
	public get size (): number
	{
		return this.__map.size;
	}
	
	/** Initiate a new readonly map. */
	public constructor (map: Map<K, V>)
	{
		this.__map = map;
	}
	
	/**
	 * Check if key exists in the read only map.
	 * @param key The key to check.
	 */
	public has (key: K): boolean
	{
		return this.__map.has(key);
	}
	
	/**
	 * Get a value from the read only map.
	 * @param key The key to fetch.
	 */
	public get (key: K): V | void
	{
		return this.__map.get(key);
	}
	
	/**
	 * Iterate over every entry in the map.
	 * @param cb The callback.
	 */
	public forEach (cb: (value: V, key: K, source: this) => void): this
	{
		this.__map.forEach((v, k, s) => cb(v, k, this));
		return this;
	}
	
	/** Get the entries stored in the readonly map. */
	public entries (): IterableIterator<readonly [ K, V ]>
	{
		return this.__map.entries();
	}
	
	/** Get the keys stored in the readonly map. */
	public keys (): IterableIterator<K>
	{
		return this.__map.keys();
	}
	
	/** Get the values stored in the readonly map. */
	public values (): IterableIterator<V>
	{
		return this.__map.values();
	}
	
}
