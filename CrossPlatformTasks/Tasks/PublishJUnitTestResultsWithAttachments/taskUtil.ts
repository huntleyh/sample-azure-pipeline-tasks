export default class Util
{
    /**
     * Return the string value of the provide val parameter or null 
     * @param val 
     */
    static getStringValue(val: string | undefined): string
    {
        if(!val)
            return "";
        else
            return val.valueOf();
    }
    /**
     * 
     * @param values 
     * @param propName 
     */
    static squashArray(values: any[], propName: string = "message", separator: string = ""): string
    {
        let val: string = "";
        
        if(values)
        {
            for(var i: number = 0; i < values.length; i++)
            {
                if(i > 0)
                    val = val + separator;
                val = val + `${Util.concatArray(values[i][propName])}`;
            }
        }
        return val;
    }
    /**
     * 
     * @param values 
     * @param lineBreak 
     */
    static concatArray(values: any[], lineBreak: string = ";"): string
    {
        let val: string = "";
        
        if(values)
        {
            for(var i: number = 0; i < values.length; i++)
            {
                if(i > 0)
                    val = val + lineBreak;

                val = val + `${values[i]}`;
            }
        }
        return val;
    }
    /**
     * 
     * @param values 
     */
    static isEmptyArray(values: any[]): boolean
    {
        if(values && values.length > 0)
            return false;
        return true;
    }
    /**
     * 
     * @param values 
     * @param search 
     */
    static stringIsEqual(values: string[], search: string): boolean
    {
        for(var i: number = 0; i < values.length; i++)
        {
            if(values[i] == search)
                return true;
        }
        return false;
    }
}