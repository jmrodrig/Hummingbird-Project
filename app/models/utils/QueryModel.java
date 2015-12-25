package models.utils;

import java.util.List;

import play.db.ebean.Model.Finder;

import com.avaje.ebean.Query;

public class QueryModel {
	
	public static <T> List<T> findAll(Finder<Long, T> finder, String qType, String query,
			String sortName, String sortOrder, int resultsPerPage, int page,
			QueryResult<T> dbResult) {

		Query<T> dbQuery;
    	if (qType == null || qType.length() == 0 || query == null || query.length() == 0)
    	{
    		dbQuery = finder.where("1")
    				.orderBy(sortName + " " + sortOrder);
    	}
    	else
    	{
    		dbQuery = finder.where()
        			.ilike(qType, query)
        			.orderBy(sortName + " " + sortOrder);
    	}
    	// make the query to database
    	List<T> rows = dbQuery.findPagingList(resultsPerPage)
    			.getPage(page).getList();
    	if (dbResult != null)
    	{
    		dbResult.setRows(rows);
    		dbResult.setMaxRows(dbQuery.findRowCount());
    	}
    	
    	return rows;
	}
}
