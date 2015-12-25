package models.utils;

import java.util.List;

public class QueryResult<T> {
	private int maxRows;

	private List<T> rows;
	
	public int getMaxRows() {
		return maxRows;
	}

	public void setMaxRows(int totalRows) {
		this.maxRows = totalRows;
	}

	public List<T> getRows() {
		return rows;
	}

	public void setRows(List<T> rows) {
		this.rows = rows;
	}
}
